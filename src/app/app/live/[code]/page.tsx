import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Copy,
  Heart,
  Play,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { completeLiveSession, deleteLiveSession } from "@/app/app/actions";
import { createClient } from "@/lib/supabase/server";
import { fetchTrendingMovies } from "@/lib/tmdb";
import {
  buildDynamicMatches,
  buildMovieMap,
  filtersFromUnknown,
  formatRuntime,
  normalizeSessionCode,
  rankMoviesForUser,
  topTasteGenres,
  type MatchParticipant,
  type MatchSwipe,
} from "@/lib/vibe-session";

type LiveSessionPageProps = {
  params: Promise<{
    code: string;
  }>;
  searchParams?: Promise<{
    error?: string | string[];
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
  joined_at?: string;
  profiles?: ParticipantProfile | ParticipantProfile[] | null;
};

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function profileFromParticipant(row: ParticipantRow) {
  return Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
}

export default async function LiveSessionPage({
  params,
  searchParams,
}: LiveSessionPageProps) {
  const { code: rawCode } = await params;
  const code = normalizeSessionCode(rawCode);
  const query = (await searchParams) ?? {};
  const error = firstString(query.error);

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("id, code, title, creator_id, status, duration_seconds, filters, created_at, expires_at")
    .eq("code", code)
    .maybeSingle();

  if (!session) {
    redirect("/app?error=Session not found");
  }

  const [
    { data: participantRows },
    { data: swipeRows },
    { data: profile },
    trendingMovies,
  ] = await Promise.all([
    supabase
      .from("session_participants")
      .select("role, joined_at, profiles(id, display_name, email, avatar_initials)")
      .eq("session_id", session.id)
      .order("joined_at", { ascending: true }),
    supabase
      .from("swipes")
      .select("user_id, movie_id, intent, created_at")
      .eq("session_id", session.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("taste_profile")
      .eq("id", user.id)
      .maybeSingle(),
    fetchTrendingMovies(),
  ]);

  const participants: MatchParticipant[] = ((participantRows ?? []) as ParticipantRow[])
    .flatMap((row): MatchParticipant[] => {
      const participantProfile = profileFromParticipant(row);
      if (!participantProfile?.id) return [];

      const displayName =
        participantProfile?.display_name ||
        participantProfile?.email?.split("@")[0] ||
        "Movie matcher";

      return [{
        id: participantProfile.id,
        displayName,
        role: row.role,
      }];
    });

  const swipes = (swipeRows ?? []) as MatchSwipe[];
  const filters = filtersFromUnknown(session.filters);
  const rankedMovies = rankMoviesForUser(trendingMovies, filters, profile?.taste_profile);
  const movieMap = buildMovieMap(rankedMovies);
  const matches = buildDynamicMatches({
    currentUserId: user.id,
    movieMap,
    participants,
    swipes,
  });
  const likedCount = swipes.filter((swipe) => swipe.intent === "like").length;
  const isCreator = session.creator_id === user.id;
  const isComplete = session.status === "complete";
  const tasteGenres = topTasteGenres(profile?.taste_profile);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <section className="rounded-lg border border-white/12 bg-[#101722] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-[#f0b44c]">
              Live session
            </p>
            <h1 className="mt-2 text-3xl font-black text-[#fff8ee] sm:text-5xl">
              {session.title || "Movie night"}
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#f0b44c]/25 bg-[#f0b44c]/10 px-3 text-sm font-black text-[#ffd98a]">
                <Copy className="size-4" aria-hidden="true" />
                {session.code}
              </span>
              <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-bold text-[#c5cedc]">
                <Clock className="size-4" aria-hidden="true" />
                {formatRuntime(session.duration_seconds)}
              </span>
              <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-3 text-sm font-bold text-emerald-100">
                <Users className="size-4" aria-hidden="true" />
                {participants.length} joined
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            <Link
              href={`/app/swipe?session=${encodeURIComponent(session.code)}`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#f0b44c] px-4 text-sm font-black text-[#18100b] transition hover:bg-[#ffd06f]"
            >
              <Play className="size-4 fill-[#18100b]" aria-hidden="true" />
              Swipe
            </Link>
            <Link
              href={`/app/matches?session=${encodeURIComponent(session.code)}`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/8 px-4 text-sm font-black text-[#fff8ee] transition hover:bg-white/12"
            >
              <Heart className="size-4" aria-hidden="true" />
              Matches
            </Link>
            {isCreator && !isComplete ? (
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <form action={completeLiveSession} className="flex-1">
                  <input type="hidden" name="sessionId" value={session.id} />
                  <input type="hidden" name="code" value={session.code} />
                  <button
                    type="submit"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-4 text-sm font-black text-emerald-100 transition hover:bg-emerald-300/15"
                  >
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    Finish
                  </button>
                </form>
                <form action={deleteLiveSession} className="flex-1">
                  <input type="hidden" name="sessionId" value={session.id} />
                  <button
                    type="submit"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-rose-300/20 bg-rose-300/10 px-4 text-sm font-black text-rose-100 transition hover:bg-rose-300/15"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Delete Room
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </div>

        {error ? (
          <p className="mt-5 rounded-lg border border-rose-300/25 bg-rose-300/10 p-3 text-sm leading-6 text-rose-100">
            {error}
          </p>
        ) : null}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="rounded-lg border border-white/12 bg-[#101722] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-[#f0b44c]">
                  Ranked deck preview
                </p>
                <h2 className="mt-1 text-2xl font-black text-[#fff8ee]">
                  Best next cards
                </h2>
              </div>
              <Sparkles className="size-5 text-[#f0b44c]" aria-hidden="true" />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {rankedMovies.slice(0, 3).map((movie) => (
                <article
                  key={movie.id}
                  className="rounded-lg border border-white/10 bg-black/20 p-4"
                >
                  <h3 className="line-clamp-1 text-lg font-black text-[#fff8ee]">
                    {movie.title}
                  </h3>
                  <p className="mt-1 text-xs font-bold text-[#f0b44c]">
                    {movie.runtime_minutes}m | {movie.genres.slice(0, 2).join(", ")}
                  </p>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#aeb7c7]">
                    {movie.overview}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-white/12 bg-[#101722] p-5">
            <p className="text-xs font-bold uppercase text-[#f0b44c]">
              Session activity
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <p className="text-2xl font-black text-[#fff8ee]">{swipes.length}</p>
                <p className="text-xs font-bold text-[#8f9bad]">total swipes</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <p className="text-2xl font-black text-[#fff8ee]">{likedCount}</p>
                <p className="text-xs font-bold text-[#8f9bad]">likes</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <p className="text-2xl font-black text-[#fff8ee]">{matches.length}</p>
                <p className="text-xs font-bold text-[#8f9bad]">match leads</p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-white/12 bg-[#101722] p-5">
            <p className="text-xs font-bold uppercase text-[#f0b44c]">
              People
            </p>
            <div className="mt-4 space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 p-3"
                >
                  <span className="font-bold text-[#fff8ee]">
                    {participant.displayName}
                  </span>
                  <span className="text-xs font-bold uppercase text-[#8f9bad]">
                    {participant.role}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-white/12 bg-[#101722] p-5">
            <p className="text-xs font-bold uppercase text-[#f0b44c]">
              Filters
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[...filters.moods, filters.runtime, ...filters.genres, filters.releaseAge, filters.animationPreference].map(
                (filter) => (
                  <span
                    key={filter}
                    className="inline-flex min-h-8 items-center rounded-lg border border-[#f0b44c]/25 bg-[#f0b44c]/10 px-2.5 text-xs font-bold text-[#ffd98a]"
                  >
                    {filter}
                  </span>
                ),
              )}
            </div>
          </section>

          <section className="rounded-lg border border-white/12 bg-[#101722] p-5">
            <p className="text-xs font-bold uppercase text-[#f0b44c]">
              Taste memory
            </p>
            <p className="mt-3 text-sm leading-6 text-[#aeb7c7]">
              {tasteGenres.length
                ? `Your recent likes lean ${tasteGenres.join(", ")}. The deck gives those genres a small boost.`
                : "Swipe a few cards and this starts learning your repeat tastes."}
            </p>
          </section>
        </aside>
      </section>
    </main>
  );
}
