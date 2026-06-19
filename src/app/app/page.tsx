import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Heart,
  Link2,
  Play,
  Search,
  SlidersHorizontal,
  Sparkles,
  Timer,
  Users,
} from "lucide-react";
import {
  createLiveSession,
  joinLiveSession,
  saveStarterFilters,
} from "@/app/app/actions";
import AnimatedSubmit from "@/components/AnimatedSubmit";
import VibeMatchLogo from "@/components/VibeMatchLogo";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { fetchTrendingMovies } from "@/lib/tmdb";
import { movies } from "@/lib/vibematch-data";
import {
  ANIMATION_OPTIONS,
  GENRE_OPTIONS,
  MOOD_OPTIONS,
  RELEASE_AGE_OPTIONS,
  RUNTIME_OPTIONS,
  filtersFromProfile,
  pickRandomMovie,
  rankMoviesForUser,
  topTasteGenres,
} from "@/lib/vibe-session";

type AppPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
    message?: string | string[];
  }>;
};

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function releaseYear(releaseDate: string) {
  return new Date(releaseDate).getFullYear();
}

function fieldId(prefix: string, value: string) {
  return `${prefix}-${value.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export default async function AppPage({ searchParams }: AppPageProps) {
  const params = (await searchParams) ?? {};
  const error = firstString(params.error);
  const message = firstString(params.message);

  if (!isSupabaseConfigured()) {
    return (
      <main className="min-h-screen bg-[#090b11] px-5 py-8 text-[#fff8ee] sm:px-8">
        <div className="mx-auto max-w-3xl rounded-lg border border-amber-300/25 bg-amber-300/10 p-5">
          <VibeMatchLogo className="mb-8" />
          <h1 className="text-3xl font-black">Supabase needs keys first.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-100">
            Add the public URL and publishable key to{" "}
            <code className="font-mono text-xs">.env.local</code>, then restart
            the dev server to unlock the real app dashboard.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[#f0b44c] px-4 text-sm font-bold text-[#18100b]"
          >
            Back to login
          </Link>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const [
    { data: profile },
    { data: participantRows },
    { data: swipeRows },
    trendingMovies,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "favorite_genres, mood_preferences, runtime_preference, release_age_preference, animation_preference, taste_profile",
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("session_participants")
      .select("session_id")
      .eq("user_id", user.id),
    supabase
      .from("swipes")
      .select("intent")
      .eq("user_id", user.id),
    fetchTrendingMovies(),
  ]);

  const sessionIds = [...new Set((participantRows ?? []).map((row) => row.session_id))];
  const { data: recentSessions } = sessionIds.length
    ? await supabase
        .from("sessions")
        .select("id, code, title, status, duration_seconds, created_at")
        .in("id", sessionIds)
        .order("created_at", { ascending: false })
        .limit(4)
    : { data: [] };

  const filters = filtersFromProfile(profile);
  const rankedMovies = rankMoviesForUser(trendingMovies.length ? trendingMovies : movies, filters, profile?.taste_profile);
  const featuredMovie = pickRandomMovie(trendingMovies.length ? trendingMovies : movies) ?? movies[0];
  const tasteGenres = topTasteGenres(profile?.taste_profile);
  const totalSwipes = swipeRows?.length ?? 0;
  const likedSwipes = swipeRows?.filter((swipe) => swipe.intent === "like").length ?? 0;
  const completedSessions = recentSessions?.filter((session) => session.status === "complete").length ?? 0;
  const activeSession = recentSessions?.find((session) => session.status !== "complete");

  return (
    <main className="bg-[#090b11] text-[#fff8ee]">
      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          {message ? (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-300/25 bg-emerald-300/10 p-4 text-emerald-100">
              <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
              <p className="text-sm leading-6">{message}</p>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-rose-300/25 bg-rose-300/10 p-4 text-sm leading-6 text-rose-100">
              {error}
            </div>
          ) : null}

          <section className="rounded-lg border border-white/12 bg-[#101722] p-5 sm:p-6">
            <p className="text-xs font-bold uppercase text-[#f0b44c]">
              Interactive dashboard
            </p>
            <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
              Ready to find the movie you both want?
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#b9c1cf] sm:text-base">
              Start a live room, join with a code, or quick-swipe to train your
              taste memory.
            </p>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/app/swipe"
              prefetch={false}
              className="flex min-h-24 items-center gap-4 rounded-lg border border-white/12 bg-[#111722] p-4 text-left transition hover:border-white/20 hover:bg-[#151d2b]"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#f0b44c] text-[#18100b]">
                <Play className="size-5 fill-[#18100b]" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-black">Quick Swipe</span>
                <span className="mt-1 block text-sm leading-5 text-[#aeb7c7]">
                  Solo taste builder
                </span>
              </span>
            </Link>
            <Link
              href="/app/matches"
              className="flex min-h-24 items-center gap-4 rounded-lg border border-white/12 bg-[#111722] p-4 text-left transition hover:border-white/20 hover:bg-[#151d2b]"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#f17c67] text-[#210d0a]">
                <Heart className="size-5 fill-[#210d0a]" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-black">View Matches</span>
                <span className="mt-1 block text-sm leading-5 text-[#aeb7c7]">
                  Real saved swipes
                </span>
              </span>
            </Link>
            <Link
              href="/app/search"
              className="flex min-h-24 items-center gap-4 rounded-lg border border-white/12 bg-[#111722] p-4 text-left transition hover:border-white/20 hover:bg-[#151d2b]"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#c8b6ff] text-[#151026]">
                <Search className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-black">Find Movies</span>
                <span className="mt-1 block text-sm leading-5 text-[#aeb7c7]">
                  Search TMDB
                </span>
              </span>
            </Link>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <form
              action={createLiveSession}
              className="rounded-lg border border-white/12 bg-[#101722] p-5"
            >
              <div className="mb-5 flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#2dd4a7] text-[#061b16]">
                  <Timer className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-xl font-black">Start Live Session</h2>
                  <p className="mt-1 text-sm leading-6 text-[#8f9bad]">
                    Creates a shareable code using your saved filters.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-2 block text-xs font-bold text-[#f0b44c]" htmlFor="title">
                    Session name
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    defaultValue="Movie night"
                    className="h-11 w-full rounded-lg border border-white/12 bg-black/20 px-3 text-sm text-[#fff8ee] outline-none placeholder:text-[#687386] focus:border-[#f0b44c]/60"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold text-[#f0b44c]" htmlFor="duration">
                    Timer
                  </label>
                  <select
                    id="duration"
                    name="duration"
                    defaultValue="180"
                    className="h-11 w-full rounded-lg border border-white/12 bg-black/20 px-3 text-sm text-[#fff8ee] outline-none [color-scheme:dark] focus:border-[#f0b44c]/60"
                  >
                    <option value="60">1 minute</option>
                    <option value="180">3 minutes</option>
                    <option value="300">5 minutes</option>
                    <option value="600">10 minutes</option>
                  </select>
                </div>
              </div>

              <AnimatedSubmit className="mt-5 h-11 w-full rounded-lg bg-[#2dd4a7] px-4 text-sm font-black text-[#061b16] hover:bg-[#4ade80]">
                <Timer className="size-4" aria-hidden="true" />
                Create room
              </AnimatedSubmit>
            </form>

            <form
              action={joinLiveSession}
              className="rounded-lg border border-white/12 bg-[#101722] p-5"
            >
              <div className="mb-5 flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#c8b6ff] text-[#151026]">
                  <Link2 className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-xl font-black">Join Session</h2>
                  <p className="mt-1 text-sm leading-6 text-[#8f9bad]">
                    Enter a code from a friend or partner.
                  </p>
                </div>
              </div>

              <label className="mb-2 block text-xs font-bold text-[#f0b44c]" htmlFor="code">
                Code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                placeholder="VIBE-ABCD"
                className="h-11 w-full rounded-lg border border-white/12 bg-black/20 px-3 font-mono text-sm uppercase tracking-widest text-[#fff8ee] outline-none placeholder:text-[#687386] focus:border-[#f0b44c]/60"
              />

              <AnimatedSubmit className="mt-5 h-11 w-full rounded-lg bg-[#c8b6ff] px-4 text-sm font-black text-[#151026] hover:bg-[#d9ccff]">
                <Link2 className="size-4" aria-hidden="true" />
                Join room
              </AnimatedSubmit>
            </form>
          </section>

          <form
            action={saveStarterFilters}
            className="rounded-lg border border-white/12 bg-[#101722] p-5"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-[#f0b44c]">
                  Starter filters
                </p>
                <h2 className="mt-1 text-2xl font-black">Taste controls</h2>
              </div>
              <SlidersHorizontal className="size-5 text-[#f0b44c]" aria-hidden="true" />
            </div>

            <div className="grid gap-5">
              <fieldset>
                <legend className="mb-2 text-xs font-bold text-[#f0b44c]">Mood</legend>
                <div className="flex flex-wrap gap-2">
                  {MOOD_OPTIONS.map((mood) => (
                    <label
                      key={mood}
                      htmlFor={fieldId("mood", mood)}
                      className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-white/12 bg-black/20 px-3 text-xs font-bold text-[#d7dfeb] has-checked:border-[#f0b44c] has-checked:bg-[#f0b44c] has-checked:text-[#18100b]"
                    >
                      <input
                        id={fieldId("mood", mood)}
                        name="moods"
                        value={mood}
                        type="checkbox"
                        defaultChecked={filters.moods.includes(mood)}
                        className="sr-only"
                      />
                      {mood}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-xs font-bold text-[#f0b44c]">Genre</legend>
                <div className="flex flex-wrap gap-2">
                  {GENRE_OPTIONS.map((genre) => (
                    <label
                      key={genre}
                      htmlFor={fieldId("genre", genre)}
                      className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-white/12 bg-black/20 px-3 text-xs font-bold text-[#d7dfeb] has-checked:border-[#2dd4a7] has-checked:bg-[#2dd4a7] has-checked:text-[#061b16]"
                    >
                      <input
                        id={fieldId("genre", genre)}
                        name="genres"
                        value={genre}
                        type="checkbox"
                        defaultChecked={filters.genres.includes(genre)}
                        className="sr-only"
                      />
                      {genre}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-[#f0b44c]">Runtime</span>
                  <select
                    name="runtime"
                    defaultValue={filters.runtime}
                    className="h-11 w-full rounded-lg border border-white/12 bg-black/20 px-3 text-sm text-[#fff8ee] outline-none [color-scheme:dark]"
                  >
                    {RUNTIME_OPTIONS.map((runtime) => (
                      <option key={runtime} value={runtime}>
                        {runtime}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-[#f0b44c]">Release age</span>
                  <select
                    name="releaseAge"
                    defaultValue={filters.releaseAge}
                    className="h-11 w-full rounded-lg border border-white/12 bg-black/20 px-3 text-sm text-[#fff8ee] outline-none [color-scheme:dark]"
                  >
                    {RELEASE_AGE_OPTIONS.map((releaseAge) => (
                      <option key={releaseAge} value={releaseAge}>
                        {releaseAge}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-[#f0b44c]">Format</span>
                  <select
                    name="animationPreference"
                    defaultValue={filters.animationPreference}
                    className="h-11 w-full rounded-lg border border-white/12 bg-black/20 px-3 text-sm text-[#fff8ee] outline-none [color-scheme:dark]"
                  >
                    {ANIMATION_OPTIONS.map((animationPreference) => (
                      <option key={animationPreference} value={animationPreference}>
                        {animationPreference}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <AnimatedSubmit className="mt-5 h-11 rounded-lg bg-[#f0b44c] px-5 text-sm font-black text-[#18100b] hover:bg-[#ffd06f]">
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              Save filters
            </AnimatedSubmit>
          </form>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-white/12 bg-[#101722] p-5">
            <p className="text-xs font-bold uppercase text-[#f0b44c]">
              Your stats
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-2xl font-black">{totalSwipes}</p>
                <p className="text-xs text-[#8f9bad]">swipes</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-2xl font-black">{likedSwipes}</p>
                <p className="text-xs text-[#8f9bad]">likes</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-2xl font-black">{recentSessions?.length ?? 0}</p>
                <p className="text-xs text-[#8f9bad]">rooms</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-2xl font-black">{completedSessions}</p>
                <p className="text-xs text-[#8f9bad]">finished</p>
              </div>
            </div>
          </section>

          {activeSession ? (
            <section className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-5">
              <p className="text-xs font-bold uppercase text-emerald-100">
                Active room
              </p>
              <h2 className="mt-2 text-2xl font-black">{activeSession.code}</h2>
              <p className="mt-2 text-sm leading-6 text-emerald-50/80">
                {activeSession.title || "Movie night"}
              </p>
              <Link
                href={`/app/live/${encodeURIComponent(activeSession.code)}`}
                className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2dd4a7] px-4 text-sm font-black text-[#061b16]"
              >
                Open room
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </section>
          ) : null}

          <section className="rounded-lg border border-white/12 bg-[#101722] p-5">
            <p className="flex items-center gap-2 text-xs font-bold uppercase text-[#f0b44c]">
              <Sparkles className="size-4" aria-hidden="true" />
              Featured Movie
            </p>
            <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4">
              <h3 className="line-clamp-1 text-xl font-black">{featuredMovie.title}</h3>
              <p className="mt-1 text-xs font-bold text-[#f0b44c]">
                {releaseYear(featuredMovie.release_date)} | {featuredMovie.runtime_minutes}m
              </p>
              <p className="mt-3 line-clamp-4 text-sm leading-6 text-[#b9c1cf]">
                {featuredMovie.overview}
              </p>
              {featuredMovie.poster_url && !featuredMovie.poster_url.includes("placeholder") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featuredMovie.poster_url}
                  alt={featuredMovie.title}
                  className="mt-4 aspect-[2/3] w-full rounded-lg object-cover"
                />
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-white/12 bg-[#101722] p-5">
            <p className="text-xs font-bold uppercase text-[#f0b44c]">
              Taste memory
            </p>
            <p className="mt-3 text-sm leading-6 text-[#aeb7c7]">
              {tasteGenres.length
                ? `Recent likes are strongest for ${tasteGenres.join(", ")}.`
                : "Swipe a few cards and VibeMatch starts ranking around your repeats."}
            </p>
            {rankedMovies[0] ? (
              <p className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3 text-xs font-bold leading-5 text-[#d7dfeb]">
                Next smart card: {rankedMovies[0].title}
              </p>
            ) : null}
          </section>

          <section className="rounded-lg border border-white/12 bg-[#101722] p-5">
            <p className="text-xs font-bold uppercase text-[#f0b44c]">
              Recent rooms
            </p>
            <div className="mt-4 space-y-2">
              {recentSessions?.length ? (
                recentSessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/app/live/${encodeURIComponent(session.code)}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 p-3 transition hover:bg-white/8"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-[#fff8ee]">
                        {session.title || session.code}
                      </span>
                      <span className="mt-1 block text-xs font-bold text-[#8f9bad]">
                        {session.code}
                      </span>
                    </span>
                    <span className="text-xs font-bold uppercase text-[#f0b44c]">
                      {session.status}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-sm leading-6 text-[#8f9bad]">
                  No rooms yet.
                </p>
              )}
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <Link
              href="/app/profile"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/8 text-sm font-bold transition hover:bg-white/12"
            >
              <Users className="size-4" aria-hidden="true" />
              Profile
            </Link>
            <Link
              href="/app/search"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/8 text-sm font-bold transition hover:bg-white/12"
            >
              <Search className="size-4" aria-hidden="true" />
              Find
            </Link>
          </section>
        </aside>
      </section>
    </main>
  );
}
