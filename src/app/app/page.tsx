import Link from "next/link";
import {
  Film,
  Heart,
  Link2,
  Play,
  Search,
  SlidersHorizontal,
  Timer,
  UserPlus,
} from "lucide-react";
import { liveSession, matches, movies } from "@/lib/vibematch-data";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { fetchTrendingMovies } from "@/lib/tmdb";

const appActions = [
  {
    title: "Start Quick Swipe",
    detail: "Search and swipe on new trending movie decks.",
    icon: Play,
    tone: "bg-[#f0b44c] text-[#18100b]",
    href: "/app/search",
  },
  {
    title: "Start Live Session",
    detail: "Pick a friend, choose a timer, and share a join code.",
    icon: Timer,
    tone: "bg-[#2dd4a7] text-[#061b16]",
    href: "/app",
  },
  {
    title: "Join Session",
    detail: "Use a partner or roommate code to enter a live round.",
    icon: Link2,
    tone: "bg-[#c8b6ff] text-[#151026]",
    href: "/app",
  },
  {
    title: "View Matches",
    detail: "See perfect matches, almost matches, and backups.",
    icon: Heart,
    tone: "bg-[#f17c67] text-[#210d0a]",
    href: "/app/profile",
  },
];

function releaseYear(releaseDate: string) {
  return new Date(releaseDate).getFullYear();
}

export default async function AppPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="min-h-screen bg-[#090b11] px-5 py-8 text-[#fff8ee] sm:px-8">
        <div className="mx-auto max-w-3xl rounded-lg border border-amber-300/25 bg-amber-300/10 p-5">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 font-black">
            <span className="flex size-9 items-center justify-center rounded-lg bg-[#f0b44c] text-[#18100b]">
              <Film className="size-5" aria-hidden="true" />
            </span>
            VibeMatch
          </Link>
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

  // Pull dynamic trending movies from TMDB
  const trendingMovies = await fetchTrendingMovies();
  const featuredMovie = trendingMovies[0] || movies[0];
  const perfectMatches = matches.filter((match) => match.match_type === "perfect");

  return (
    <main className="bg-[#090b11] text-[#fff8ee]">
      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <div className="rounded-lg border border-white/12 bg-[#101722] p-5 sm:p-6">
            <p className="text-xs font-bold uppercase text-[#f0b44c]">
              Interactive Dashboard
            </p>
            <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
              Ready to find the movie you both want?
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#b9c1cf] sm:text-base">
              The auth gate is live. Start by finding movies using our TMDB integration, managing your settings, or updating your profile statistics.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {appActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className="flex min-h-24 items-center gap-4 rounded-lg border border-white/12 bg-[#111722] p-4 text-left transition hover:bg-[#151d2b] hover:border-white/20"
                >
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${action.tone}`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-black text-[#fff8ee]">
                      {action.title}
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-[#aeb7c7]">
                      {action.detail}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>

          <section className="rounded-lg border border-white/12 bg-[#101722] p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-[#f0b44c]">
                  Vibe check
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  Current starter filters
                </h2>
              </div>
              <SlidersHorizontal className="size-5 text-[#f0b44c]" aria-hidden="true" />
            </div>
            <div className="flex flex-wrap gap-2">
              {["Cozy", "Funny", "Under 2 hours", "Comedy", "2000s and newer", "Either"].map(
                (filter) => (
                  <span
                    key={filter}
                    className="inline-flex min-h-9 items-center rounded-full border border-[#f0b44c] bg-[#f0b44c] px-3 py-2 text-xs font-bold text-[#18100b]"
                  >
                    {filter}
                  </span>
                ),
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-white/12 bg-[#101722] p-5">
            <p className="text-xs font-bold uppercase text-[#f0b44c]">
              Live session
            </p>
            <h2 className="mt-2 text-2xl font-black">{liveSession.code}</h2>
            <p className="mt-2 text-sm leading-6 text-[#aeb7c7]">
              60-second two-person round concept, ready for Supabase Realtime.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-2xl font-black">2</p>
                <p className="text-xs text-[#8f9bad]">participants</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-2xl font-black">{perfectMatches.length}</p>
                <p className="text-xs text-[#8f9bad]">perfect match</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-white/12 bg-[#101722] p-5">
            <p className="text-xs font-bold uppercase text-[#f0b44c]">
              Trending Featured card
            </p>
            <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4">
              <h3 className="text-xl font-black line-clamp-1">{featuredMovie.title}</h3>
              <p className="mt-1 text-xs font-bold text-[#f0b44c]">
                {releaseYear(featuredMovie.release_date)} |{" "}
                {featuredMovie.runtime_minutes}m
              </p>
              <p className="mt-3 text-sm leading-6 text-[#b9c1cf] line-clamp-4">
                {featuredMovie.overview}
              </p>
              {featuredMovie.poster_url && !featuredMovie.poster_url.includes("placeholder") && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featuredMovie.poster_url}
                  alt={featuredMovie.title}
                  className="mt-4 aspect-[2/3] w-full rounded-lg object-cover"
                />
              )}
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <Link
              href="/app/profile"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/8 text-sm font-bold hover:bg-white/12 transition"
            >
              <UserPlus className="size-4" aria-hidden="true" />
              Friends
            </Link>
            <Link
              href="/app/search"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/8 text-sm font-bold hover:bg-white/12 transition"
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
