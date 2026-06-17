import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchTrendingMovies } from "@/lib/tmdb";
import { rankMoviesForUser } from "@/lib/vibe-session";
import { getOrCreateSwipeSession } from "./actions";
import SwipeDeck from "@/components/SwipeDeck";

type SwipePageProps = {
  searchParams?: Promise<{
    session?: string | string[];
  }>;
};

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SwipePage({ searchParams }: SwipePageProps) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const params = (await searchParams) ?? {};
  const sessionCode = firstString(params.session);

  // Fetch trending movies from TMDB for the user to swipe
  const trendingMovies = await fetchTrendingMovies();
  
  let sessionId = "";
  let sessionTitle = "Swipe Movies";
  let resolvedSessionCode = "";
  let sessionDurationSeconds = 0;
  let movies = trendingMovies;

  try {
    const session = await getOrCreateSwipeSession(sessionCode);
    sessionId = session.id;
    sessionTitle = session.title;
    resolvedSessionCode = session.code;
    sessionDurationSeconds = session.durationSeconds;
    movies = rankMoviesForUser(trendingMovies, session.filters, session.tasteProfile);
  } catch (err) {
    console.error("Failed to initialize session:", err);
    redirect("/app?error=Failed to start swipe session");
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
      <div className="mb-8 text-center">
        <p className="text-xs font-bold uppercase text-[#f0b44c]">
          {sessionCode ? `Live code ${resolvedSessionCode}` : "Taste builder"}
        </p>
        <h1 className="mt-1 text-3xl font-black text-[#fff8ee]">{sessionTitle}</h1>
        <p className="text-sm text-[#8f9bad] mt-1">
          Swipe the ranked deck. Likes are saved to the session and your taste memory.
        </p>
      </div>

      <SwipeDeck
        movies={movies}
        sessionId={sessionId}
        sessionCode={resolvedSessionCode}
        sessionDurationSeconds={sessionDurationSeconds}
      />
    </main>
  );
}
