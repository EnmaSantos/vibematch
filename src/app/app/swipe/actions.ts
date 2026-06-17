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
  filters: ReturnType<typeof filtersFromProfile>;
  tasteProfile: unknown;
};

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
    const { data: profile } = await supabase
      .from("profiles")
      .select("taste_profile")
      .eq("id", user.id)
      .maybeSingle();
    const code = normalizeSessionCode(sessionCode);
    const { data: session, error } = await supabase
      .from("sessions")
      .select("id, code, title, duration_seconds, filters, status")
      .eq("code", code)
      .maybeSingle();

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
        role: sessionCode.startsWith("SOLO-") ? "host" : "participant",
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "session_id,user_id" },
    );

    return {
      id: session.id,
      code: session.code,
      title: session.title || "Live session",
      durationSeconds: session.duration_seconds || SOLO_SESSION_DURATION_SECONDS,
      filters: filtersFromUnknown(session.filters),
      tasteProfile: profile?.taste_profile,
    };
  }

  const code = `SOLO-${user.id.substring(0, 8).toUpperCase()}`;
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "favorite_genres, mood_preferences, runtime_preference, release_age_preference, animation_preference, taste_profile",
    )
    .eq("id", user.id)
    .maybeSingle<ProfilePreferences>();

  // Check if session exists
  const { data: session } = await supabase
    .from("sessions")
    .select("id, code, title, duration_seconds, filters")
    .eq("code", code)
    .maybeSingle();

  if (session) {
    await supabase.from("session_participants").upsert(
      {
        session_id: session.id,
        user_id: user.id,
        role: "host",
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "session_id,user_id" },
    );

    return {
      id: session.id,
      code: session.code,
      title: session.title || "Solo taste builder",
      durationSeconds: session.duration_seconds || SOLO_SESSION_DURATION_SECONDS,
      filters: filtersFromUnknown(session.filters),
      tasteProfile: profile?.taste_profile,
    };
  }

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
    filters: filtersFromUnknown(newSession.filters),
    tasteProfile: profile?.taste_profile,
  };
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
