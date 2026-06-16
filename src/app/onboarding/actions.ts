"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveOnboardingPreferences(formData: {
  favoriteGenres: string[];
  moodPreferences: string[];
  runtimePreference: string;
}) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      favorite_genres: formData.favoriteGenres,
      mood_preferences: formData.moodPreferences,
      runtime_preference: formData.runtimePreference,
      onboarding_completed: true,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating profile onboarding:", error);
    throw new Error(error.message);
  }

  revalidatePath("/app");
  revalidatePath("/app/profile");
}
