"use server";

import { revalidatePath } from "next/cache";
import { getAvatarInitials, getUserDisplayName } from "@/lib/auth/user-profile";
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

  const displayName = getUserDisplayName(user);
  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      email: user.email || "",
      display_name: displayName,
      avatar_initials: getAvatarInitials(displayName),
      favorite_genres: formData.favoriteGenres,
      mood_preferences: formData.moodPreferences,
      runtime_preference: formData.runtimePreference,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Error updating profile onboarding:", error);
    throw new Error(error.message);
  }

  revalidatePath("/app");
  revalidatePath("/app/profile");
}
