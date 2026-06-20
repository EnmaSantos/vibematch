import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Heart, Sparkles, Users } from "lucide-react";
import SessionSaveControl from "@/components/SessionSaveControl";
import { createClient } from "@/lib/supabase/server";
import { fetchMovieById } from "@/lib/tmdb";
import { movies as mockMovies, type MediaItem } from "@/lib/vibematch-data";
import {
  buildDynamicMatches,
  buildMovieMap,
  normalizeSessionCode,
  type MatchParticipant,
  type MatchSwipe,
} from "@/lib/vibe-session";

type MatchesPageProps = {
  searchParams?: Promise<{
    session?: string | string[];
  }>;
};

type ParticipantProfile = {
  id?: string;
  display_name?: string | null;
  email?: string | null;
  avatar_initials?: string | null;
};

type ParticipantRow = {
  role?: string;
  profiles?: ParticipantProfile | ParticipantProfile[] | null;
};

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function profileFromParticipant(row: ParticipantRow) {
  return Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
}

function NoSharedMatches() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
      <section className="rounded-lg border border-white/12 bg-[#101722] p-6 text-center">
        <Sparkles className="mx-auto size-10 text-[#f0b44c]" aria-hidden="true" />
        <h1 className="mt-4 text-3xl font-black text-[#fff8ee]">No matches yet</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#aeb7c7]">
          Start or join a live session. Shared matches appear once people in the room save their likes.
        </p>
        <Link
          href="/app"
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#f0b44c] px-4 text-sm font-bold text-[#18100b]"
        >
          Go to dashboard
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const params = (await searchParams) ?? {};
  const requestedCode = firstString(params.session);

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: membershipRows } = await supabase
    .from("session_participants")
    .select("session_id, saved_at")
    .eq("user_id", user.id);

  const sessionIds = [...new Set((membershipRows ?? []).map((row) => row.session_id))];

  if (sessionIds.length === 0) {
    return <NoSharedMatches />;
  }

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, code, title, status, created_at")
    .in("id", sessionIds)
    .not("code", "like", "SOLO-%")
    .order("created_at", { ascending: false });

  if (!sessions?.length) {
    return <NoSharedMatches />;
  }

  const savedSessionIds = new Set(
    (membershipRows ?? [])
      .filter((membership) => Boolean(membership.saved_at))
      .map((membership) => membership.session_id),
  );
  const normalizedRequestedCode = requestedCode
    ? normalizeSessionCode(requestedCode)
    : undefined;
  const visibleSessions = (sessions ?? []).filter(
    (session) =>
      savedSessionIds.has(session.id) || session.code === normalizedRequestedCode,
  );

  const selectedSession =
    (requestedCode
      ? visibleSessions.find((session) => session.code === normalizedRequestedCode)
      : visibleSessions[0]) ?? visibleSessions[0];

  if (!selectedSession) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
        <section className="rounded-lg border border-white/12 bg-[#101722] p-6 text-center">
          <Sparkles className="mx-auto size-10 text-[#f0b44c]" aria-hidden="true" />
          <h1 className="mt-4 text-3xl font-black text-[#fff8ee]">No saved sessions yet</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#aeb7c7]">
            Sessions are temporary by default. Save one during the room or from its results to keep it here.
          </p>
          <Link
            href="/app"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#f0b44c] px-4 text-sm font-bold text-[#18100b]"
          >
            Go to dashboard
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </section>
      </main>
    );
  }

  const isSelectedSessionSaved = savedSessionIds.has(selectedSession.id);

  const [{ data: participantRows }, { data: swipeRows }] = await Promise.all([
    supabase
      .from("session_participants")
      .select("role, profiles(id, display_name, email, avatar_initials)")
      .eq("session_id", selectedSession.id),
    supabase
      .from("swipes")
      .select("user_id, movie_id, intent, created_at")
      .eq("session_id", selectedSession.id)
      .order("created_at", { ascending: false }),
  ]);

  const participants: MatchParticipant[] = ((participantRows ?? []) as ParticipantRow[])
    .flatMap((row): MatchParticipant[] => {
      const profile = profileFromParticipant(row);
      if (!profile?.id) return [];

      return [{
        id: profile.id,
        displayName: profile?.display_name || profile?.email?.split("@")[0] || "Movie matcher",
        role: row.role,
      }];
    });

  const swipes = (swipeRows ?? []) as MatchSwipe[];
  const swipedMovieIds = [...new Set(swipes.map((swipe) => swipe.movie_id))];
  const knownMovies = mockMovies.filter((movie) => swipedMovieIds.includes(movie.id));
  const missingMovieIds = swipedMovieIds.filter(
    (movieId) => !knownMovies.some((movie) => movie.id === movieId),
  );
  const fetchedMovies = (await Promise.all(missingMovieIds.map(fetchMovieById))).filter(
    (movie): movie is MediaItem => Boolean(movie),
  );
  const movieMap = buildMovieMap([...knownMovies, ...fetchedMovies]);
  const matches = buildDynamicMatches({
    currentUserId: user.id,
    movieMap,
    participants,
    swipes,
  });
  const perfectMatches = matches.filter((match) => match.matchType === "perfect");

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-[#f0b44c]">Matches</p>
          <h1 className="mt-2 text-3xl font-black text-[#fff8ee] sm:text-5xl">
            {selectedSession.title || selectedSession.code}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#8f9bad]">
            {isSelectedSessionSaved
              ? "Built from the swipes in this saved session."
              : "This session is temporary. Save it if you want to keep it in your history."}
          </p>
          <div className="mt-4 max-w-sm">
            <SessionSaveControl
              sessionId={selectedSession.id}
              initialSaved={isSelectedSessionSaved}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {visibleSessions.slice(0, 5).map((session) => (
            <Link
              key={session.id}
              href={`/app/matches?session=${encodeURIComponent(session.code)}`}
              className={`inline-flex h-10 items-center rounded-lg border px-3 text-xs font-black ${
                session.id === selectedSession.id
                  ? "border-[#f0b44c] bg-[#f0b44c] text-[#18100b]"
                  : "border-white/12 bg-white/8 text-[#fff8ee] hover:bg-white/12"
              }`}
            >
              {session.code}
            </Link>
          ))}
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-white/12 bg-[#101722] p-5">
          <Heart className="mb-3 size-5 text-rose-300" aria-hidden="true" />
          <p className="text-2xl font-black text-[#fff8ee]">{perfectMatches.length}</p>
          <p className="text-xs font-bold text-[#8f9bad]">perfect matches</p>
        </div>
        <div className="rounded-lg border border-white/12 bg-[#101722] p-5">
          <Sparkles className="mb-3 size-5 text-[#f0b44c]" aria-hidden="true" />
          <p className="text-2xl font-black text-[#fff8ee]">{matches.length}</p>
          <p className="text-xs font-bold text-[#8f9bad]">liked titles</p>
        </div>
        <div className="rounded-lg border border-white/12 bg-[#101722] p-5">
          <Users className="mb-3 size-5 text-emerald-300" aria-hidden="true" />
          <p className="text-2xl font-black text-[#fff8ee]">{participants.length}</p>
          <p className="text-xs font-bold text-[#8f9bad]">participants</p>
        </div>
      </section>

      {matches.length ? (
        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {matches.map((match) => (
            <article
              key={match.movieId}
              className="flex gap-4 rounded-lg border border-white/12 bg-[#101722] p-5"
            >
              {match.movie?.poster_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={match.movie.poster_url}
                  alt={match.movie.title || "Movie poster"}
                  className="aspect-[2/3] w-20 sm:w-24 shrink-0 rounded-md object-cover border border-white/10 bg-black/20"
                />
              ) : null}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase text-[#f0b44c]">
                        {match.matchType === "perfect"
                          ? "Perfect match"
                          : match.matchType === "almost"
                            ? "Almost"
                            : "Saved like"}
                      </p>
                      <h2 className="mt-1 line-clamp-1 text-2xl font-black text-[#fff8ee]">
                        {match.movie?.title || match.movieId}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-[#aeb7c7]">
                        {match.reason}
                      </p>
                    </div>
                    <span className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm font-black text-[#ffd98a] shrink-0">
                      {match.score}
                    </span>
                  </div>

                  {match.movie ? (
                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#b9c1cf]">
                      {match.movie.overview}
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {match.likedBy.map((name) => (
                    <span
                      key={`like-${match.movieId}-${name}`}
                      className="inline-flex h-7 items-center rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-2 text-xs font-bold text-emerald-100"
                    >
                      {name} liked
                    </span>
                  ))}
                  {match.skippedBy.map((name) => (
                    <span
                      key={`skip-${match.movieId}-${name}`}
                      className="inline-flex h-7 items-center rounded-lg border border-rose-300/20 bg-rose-300/10 px-2 text-xs font-bold text-rose-100"
                    >
                      {name} skipped
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="mt-6 rounded-lg border border-dashed border-white/14 bg-[#101722] p-8 text-center">
          <Sparkles className="mx-auto size-10 text-[#f0b44c]" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-black text-[#fff8ee]">
            Waiting on likes
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#aeb7c7]">
            Swipe in this session and the results will start filling in here.
          </p>
          <Link
            href={`/app/swipe?session=${encodeURIComponent(selectedSession.code)}`}
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#f0b44c] px-4 text-sm font-bold text-[#18100b]"
          >
            Swipe this session
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </section>
      )}
    </main>
  );
}
