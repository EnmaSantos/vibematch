import { redirect } from "next/navigation";
import { Film } from "lucide-react";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchTrendingMovies } from "@/lib/tmdb";
import { getOrCreateSoloSession } from "./actions";
import SwipeDeck from "@/components/SwipeDeck";

export default async function SwipePage() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  // Fetch trending movies from TMDB for the user to swipe
  const movies = await fetchTrendingMovies();
  
  let sessionId = "";
  try {
    sessionId = await getOrCreateSoloSession();
  } catch (err) {
    console.error("Failed to initialize session:", err);
    redirect("/app?error=Failed to start swipe session");
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-[#fff8ee]">Swipe Movies</h1>
        <p className="text-sm text-[#8f9bad] mt-1">
          Build your taste profile by swiping on trending films. Likes are saved to the database.
        </p>
      </div>

      <SwipeDeck movies={movies} sessionId={sessionId} />
    </main>
  );
}
