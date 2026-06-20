import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchMoviesForSession } from "@/lib/tmdb";
import { normalizeTasteProfile, rankMoviesForUser } from "@/lib/vibe-session";
import { getOrCreateSwipeSession } from "./actions";
import SwipeDeck from "@/components/SwipeDeck";

const SOLO_DECK_SIZE = 12;
const LIVE_DECK_SIZE = 24;

type SwipePageProps = {
  searchParams?: Promise<{
    round?: string | string[];
    session?: string | string[];
  }>;
};

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function sessionRound(value: string | undefined) {
  const round = Number(value);
  return Number.isInteger(round) && round > 0 ? Math.min(round, 25) : 0;
}

export default async function SwipePage({ searchParams }: SwipePageProps) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const params = (await searchParams) ?? {};
  const sessionCode = firstString(params.session);
  const round = sessionRound(firstString(params.round));
  
  let sessionId = "";
  let sessionTitle = "Swipe Movies";
  let resolvedSessionCode = "";
  let sessionDurationSeconds = 0;
  let initialTimeRemainingSeconds = 0;
  let initialSessionSaved = false;
  let nextDeckHref = "/app/swipe";
  let movies: Awaited<ReturnType<typeof fetchMoviesForSession>> = [];

  try {
    const session = await getOrCreateSwipeSession(sessionCode);
    sessionId = session.id;
    sessionTitle = session.title;
    resolvedSessionCode = session.code;
    sessionDurationSeconds = session.durationSeconds;
    initialTimeRemainingSeconds = session.remainingSeconds;
    initialSessionSaved = session.isSaved;
    const isSoloSession = session.code.startsWith("SOLO-");
    const deckSize = isSoloSession ? SOLO_DECK_SIZE : LIVE_DECK_SIZE;
    const recentlySeenMovieIds = normalizeTasteProfile(session.tasteProfile).lastMovieIds;
    const sessionMovies = await fetchMoviesForSession(session.filters, {
      excludedMovieIds: [...new Set([...recentlySeenMovieIds, ...session.swipedMovieIds])],
      explorationCount: isSoloSession ? 2 : 3,
      limit: deckSize,
      round,
      seed: session.code,
    });
    movies = rankMoviesForUser(sessionMovies, session.filters, session.tasteProfile).slice(
      0,
      deckSize,
    );
    nextDeckHref = isSoloSession
      ? "/app/swipe"
      : `/app/swipe?session=${encodeURIComponent(session.code)}&round=${round + 1}`;
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
          {resolvedSessionCode.startsWith("SOLO-")
            ? "A focused 12-card deck with a couple of wild cards outside your usual lane."
            : "Swipe the ranked deck. The session ends at 0:00 or after the last card."}
        </p>
      </div>

      <SwipeDeck
        movies={movies}
        sessionId={sessionId}
        sessionCode={resolvedSessionCode}
        sessionDurationSeconds={sessionDurationSeconds}
        initialTimeRemainingSeconds={initialTimeRemainingSeconds}
        initialSessionSaved={initialSessionSaved}
        nextDeckHref={nextDeckHref}
      />
    </main>
  );
}
