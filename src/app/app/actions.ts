"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  filtersFromFormData,
  filtersFromProfile,
  normalizeSessionCode,
} from "@/lib/vibe-session";

const DEFAULT_LIVE_SESSION_SECONDS = 180;
const MAX_LIVE_SESSION_SECONDS = 900;

function boundedDuration(value: FormDataEntryValue | null) {
  const duration = Number(value);

  if (!Number.isFinite(duration)) return DEFAULT_LIVE_SESSION_SECONDS;

  return Math.min(Math.max(duration, 60), MAX_LIVE_SESSION_SECONDS);
}

function randomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";

  for (let index = 0; index < 4; index += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return `VIBE-${suffix}`;
}

async function getUniqueSessionCode(supabase: Awaited<ReturnType<typeof createClient>>) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = randomCode();
    const { data } = await supabase
      .from("sessions")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (!data) return code;
  }

  return `VIBE-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

async function requireUserAndProfile() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, favorite_genres, mood_preferences, runtime_preference, release_age_preference, animation_preference, taste_profile",
    )
    .eq("id", user.id)
    .maybeSingle();

  return { profile, supabase, user };
}

export async function saveStarterFilters(formData: FormData) {
  const { supabase, user } = await requireUserAndProfile();
  const filters = filtersFromFormData(formData);

  const { error } = await supabase
    .from("profiles")
    .update({
      favorite_genres: filters.genres,
      mood_preferences: filters.moods,
      runtime_preference: filters.runtime,
      release_age_preference: filters.releaseAge,
      animation_preference: filters.animationPreference,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    redirect(`/app?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/app");
  redirect("/app?message=Starter filters saved");
}

export async function createLiveSession(formData: FormData) {
  const { profile, supabase, user } = await requireUserAndProfile();
  const durationSeconds = boundedDuration(formData.get("duration"));
  const title = formData.get("title")?.toString().trim() || "Movie night";
  const code = await getUniqueSessionCode(supabase);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationSeconds * 1000);

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({
      code,
      creator_id: user.id,
      status: "live",
      title,
      duration_seconds: durationSeconds,
      filters: filtersFromProfile(profile),
      starts_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select("id, code")
    .single();

  if (error || !session) {
    redirect(`/app?error=${encodeURIComponent(error?.message || "Could not create live session")}`);
  }

  const { error: participantError } = await supabase.from("session_participants").upsert(
    {
      session_id: session.id,
      user_id: user.id,
      role: "host",
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "session_id,user_id" },
  );

  if (participantError) {
    redirect(`/app?error=${encodeURIComponent(participantError.message)}`);
  }

  revalidatePath("/app");
  redirect(`/app/live/${session.code}`);
}

export async function joinLiveSession(formData: FormData) {
  const { supabase, user } = await requireUserAndProfile();
  const code = normalizeSessionCode(formData.get("code")?.toString() || "");

  if (!code) {
    redirect("/app?error=Enter a session code");
  }

  const { data: session, error } = await supabase
    .from("sessions")
    .select("id, code, status")
    .eq("code", code)
    .maybeSingle();

  if (error || !session) {
    redirect(`/app?error=${encodeURIComponent("No live session found for that code")}`);
  }

  if (session.status === "complete") {
    redirect(`/app/matches?session=${session.code}`);
  }

  const { error: participantError } = await supabase.from("session_participants").upsert(
    {
      session_id: session.id,
      user_id: user.id,
      role: "participant",
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "session_id,user_id" },
  );

  if (participantError) {
    redirect(`/app?error=${encodeURIComponent(participantError.message)}`);
  }

  revalidatePath("/app");
  redirect(`/app/live/${session.code}`);
}

export async function completeLiveSession(formData: FormData) {
  const { supabase, user } = await requireUserAndProfile();
  const sessionId = formData.get("sessionId")?.toString() || "";
  const code = normalizeSessionCode(formData.get("code")?.toString() || "");

  const { error } = await supabase
    .from("sessions")
    .update({
      status: "complete",
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("creator_id", user.id);

  if (error) {
    redirect(`/app/live/${code}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/app");
  redirect(`/app/matches?session=${code}`);
}
