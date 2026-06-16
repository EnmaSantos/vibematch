"use server";

import { createClient } from "@/lib/supabase/server";

export async function getOrCreateSoloSession(): Promise<string> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized");
  }

  const code = `SOLO-${user.id.substring(0, 8).toUpperCase()}`;

  // Check if session exists
  const { data: session, error: selectError } = await supabase
    .from("sessions")
    .select("id")
    .eq("code", code)
    .single();

  if (session) {
    return session.id;
  }

  // Create solo session if it doesn't exist
  const { data: newSession, error: insertError } = await supabase
    .from("sessions")
    .insert({
      code,
      creator_id: user.id,
      status: "live",
      duration_seconds: 86400, // 24h
    })
    .select()
    .single();

  if (insertError || !newSession) {
    console.error("Error creating solo session:", insertError);
    throw new Error(insertError?.message || "Failed to create session");
  }

  return newSession.id;
}

export async function recordSwipe(session_id: string, movie_id: string, intent: "like" | "skip") {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized");
  }

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

  return { success: true };
}
