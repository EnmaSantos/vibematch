"use server";

import { createClient } from "@/lib/supabase/server";
import {
  filtersFromProfile,
  filtersFromUnknown,
  normalizeSessionCode,
  updateTasteProfile,
  type ProfilePreferences,
} from "@/lib/vibe-session";

const SOLO_SESSION_DURATION_SECONDS = 180;

type SwipeSession = {
  id: string;
  code: string;
  title: string;
  durationSeconds: number;
  remainingSeconds: number;
  filters: ReturnType<typeof filtersFromProfile>;
  tasteProfile: unknown;
  swipedMovieIds: string[];
};

function randomSoloCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";

  for (let index = 0; index < 8; index += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return `SOLO-${suffix}`;
}

async function getUniqueSoloCode(supabase: Awaited<ReturnType<typeof createClient>>) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = randomSoloCode();
    const { data } = await supabase
      .from("sessions")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (!data) return code;
  }

  return `SOLO-${Date.now().toString(36).toUpperCase()}`;
}

function getRemainingSeconds(expiresAt: string | null, durationSeconds: number) {
  if (!expiresAt) return durationSeconds;

  const remaining = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000);
  return Math.min(Math.max(remaining, 0), durationSeconds);
}

async function getSwipedMovieIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  sessionId: string,
) {
  const { data } = await supabase
    .from("swipes")
    .select("movie_id")
    .eq("session_id", sessionId)
    .eq("user_id", userId);

  return [...new Set((data ?? []).map((swipe) => swipe.movie_id))];
}

async function requireUser() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized");
  }

  return { supabase, user };
}

export async function getOrCreateSwipeSession(sessionCode?: string): Promise<SwipeSession> {
  const { supabase, user } = await requireUser();

  if (sessionCode) {
    const code = normalizeSessionCode(sessionCode);
    const [{ data: profile }, { data: session, error }] = await Promise.all([
      supabase
        .from("profiles")
        .select("taste_profile")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("sessions")
        .select("id, code, title, duration_seconds, expires_at, filters, status")
        .eq("code", code)
        .maybeSingle(),
    ]);

    if (error || !session) {
      throw new Error(error?.message || "Session not found");
    }

    if (session.status === "complete") {
      throw new Error("This session is already complete.");
    }

    await supabase.from("session_participants").upsert(
      {
        session_id: session.id,
        user_id: user.id,
        role: code.startsWith("SOLO-") ? "host" : "participant",
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "session_id,user_id" },
    );

    const swipedMovieIds = await getSwipedMovieIds(supabase, user.id, session.id);
    const durationSeconds = session.duration_seconds || SOLO_SESSION_DURATION_SECONDS;

    return {
      id: session.id,
      code: session.code,
      title: session.title || "Live session",
      durationSeconds,
      remainingSeconds: getRemainingSeconds(session.expires_at, durationSeconds),
      filters: filtersFromUnknown(session.filters),
      tasteProfile: profile?.taste_profile,
      swipedMovieIds,
    };
  }

  const [code, { data: profile }] = await Promise.all([
    getUniqueSoloCode(supabase),
    supabase
      .from("profiles")
      .select(
        "favorite_genres, mood_preferences, runtime_preference, release_age_preference, animation_preference, taste_profile",
      )
      .eq("id", user.id)
      .maybeSingle<ProfilePreferences>(),
  ]);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + SOLO_SESSION_DURATION_SECONDS * 1000);

  // Create solo session if it doesn't exist
  const { data: newSession, error: insertError } = await supabase
    .from("sessions")
    .insert({
      code,
      creator_id: user.id,
      status: "live",
      title: "Solo taste builder",
      duration_seconds: SOLO_SESSION_DURATION_SECONDS,
      filters: filtersFromProfile(profile),
      starts_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select("id, code, title, duration_seconds, filters")
    .single();

  if (insertError || !newSession) {
    console.error("Error creating solo session:", insertError);
    throw new Error(insertError?.message || "Failed to create session");
  }

  await supabase.from("session_participants").upsert(
    {
      session_id: newSession.id,
      user_id: user.id,
      role: "host",
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "session_id,user_id" },
  );

  return {
    id: newSession.id,
    code: newSession.code,
    title: newSession.title,
    durationSeconds: newSession.duration_seconds,
    remainingSeconds: newSession.duration_seconds,
    filters: filtersFromUnknown(newSession.filters),
    tasteProfile: profile?.taste_profile,
    swipedMovieIds: [],
  };
}

export async function completeSwipeSession(sessionId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("sessions")
    .update({
      status: "complete",
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("creator_id", user.id)
    .like("code", "SOLO-%");

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

export async function recordSwipe(
  session_id: string,
  movie_id: string,
  intent: "like" | "skip",
  movieGenres: string[] = [],
) {
  const { supabase, user } = await requireUser();

  // Insert or update swipe
  const { error } = await supabase
    .from("swipes")
    .upsert({
      session_id,
      user_id: user.id,
      movie_id,
      intent,
      created_at: new Date().toISOString(),
    }, {
      onConflict: "session_id,user_id,movie_id"
    });

  if (error) {
    console.error("Error recording swipe:", error);
    throw new Error(error.message);
  }

  await supabase
    .from("session_participants")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("session_id", session_id)
    .eq("user_id", user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("taste_profile")
    .eq("id", user.id)
    .maybeSingle<Pick<ProfilePreferences, "taste_profile">>();

  const tasteProfile = updateTasteProfile(
    profile?.taste_profile,
    movieGenres,
    movie_id,
    intent,
  );

  await supabase
    .from("profiles")
    .update({
      taste_profile: tasteProfile,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  return { success: true };
}
