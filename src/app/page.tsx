import type { CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock3,
  Heart,
  Lock,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { HashReset } from "@/app/hash-reset";
import { movies, type MediaItem, type WatchProviderType } from "@/lib/vibematch-data";
import { cn } from "@/lib/utils";

import LandingPreview from "@/components/LandingPreview";
import VibeMatchLogo from "@/components/VibeMatchLogo";

const matchMovie = movies[1];
const backupMovie = movies[2];

const steps = [
  {
    title: "Answer the vibe",
    body: "Pick mood, runtime, genre, era, and animation preference. Skip anything.",
    icon: Sparkles,
  },
  {
    title: "Swipe privately",
    body: "Like or skip movie cards without turning the couch into a negotiation.",
    icon: Lock,
  },
  {
    title: "Watch the match",
    body: "When both people like the same movie, VibeMatch reveals the shared yes.",
    icon: Heart,
  },
];

const differentiators = [
  "Built for friends, partners, roommates, and small groups",
  "Movies first, with United States watch availability for v1",
  "Two-person live sessions before bigger group complexity",
  "Shared taste memory later: not just what you like, what you like together",
];

const providerLabel: Record<WatchProviderType, string> = {
  ads: "Ads",
  buy: "Buy",
  free: "Free",
  rent: "Rent",
  stream: "Stream",
};

function releaseYear(releaseDate: string) {
  return new Date(releaseDate).getFullYear();
}

function runtimeLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return hours ? `${hours}h ${remainder}m` : `${remainder}m`;
}

function PosterArt({
  movie,
  className,
  compact = false,
}: {
  movie: MediaItem;
  className?: string;
  compact?: boolean;
}) {
  const style = {
    "--poster-from": movie.posterTheme.from,
    "--poster-via": movie.posterTheme.via,
    "--poster-to": movie.posterTheme.to,
  } as CSSProperties;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-white/15 bg-[linear-gradient(145deg,var(--poster-from),var(--poster-via)_50%,var(--poster-to))] shadow-2xl shadow-black/35",
        className,
      )}
      style={style}
      aria-label={`${movie.title} poster art`}
    >
      <div className="absolute inset-x-5 top-6 h-4 rounded-full bg-white/20" />
      <div className="absolute right-7 top-14 size-16 rounded-full border border-white/25 bg-white/15" />
      <div className="absolute left-7 top-24 h-28 w-16 rounded-full border border-white/20 bg-black/15" />
      <div className="absolute inset-x-6 bottom-24 h-1.5 rounded-full bg-white/30" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-5">
        <p
          className={cn(
            "font-black leading-tight text-white",
            compact ? "text-base" : "text-3xl",
          )}
        >
          {movie.title}
        </p>
        <p className="mt-2 text-xs font-bold text-white/75">
          {releaseYear(movie.release_date)} | {movie.genres.join(", ")}
        </p>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
      <VibeMatchLogo priority />
      <nav className="flex items-center gap-2">
        <Link
          href="/login"
          className="hidden h-10 items-center justify-center rounded-lg border border-white/12 bg-white/8 px-4 text-sm font-bold text-[#fff8ee] sm:inline-flex"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-[#f0b44c] px-4 text-sm font-bold text-[#18100b]"
        >
          Start
        </Link>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#090b11]">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,#2b1117_0%,#0a111d_47%,#11120d_100%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-24 bg-[repeating-linear-gradient(90deg,rgba(255,248,238,0.12)_0,rgba(255,248,238,0.12)_1px,transparent_1px,transparent_34px)] opacity-40" />
      <Header />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-8 sm:px-8 lg:min-h-[calc(100vh-80px)] lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.8fr)] lg:pb-20">
        <div className="w-full max-w-[350px] sm:max-w-2xl">
          <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-[#f0b44c]/25 bg-[#f0b44c]/10 px-3 py-2 text-xs font-bold text-[#ffd98a]">
            <MapPin className="size-4" aria-hidden="true" />
            Movies with US watch availability
          </div>
          <h1 className="text-4xl font-black leading-[1.04] text-[#fff8ee] sm:text-6xl sm:leading-[1.02] lg:text-7xl">
            Find the movie you both want to watch.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#c5cedc] sm:text-lg">
            VibeMatch helps two people stop negotiating with a streaming menu.
            Set a quick vibe, swipe privately, and reveal the movies you both
            said yes to.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#f0b44c] px-5 text-sm font-bold text-[#18100b] transition hover:bg-[#ffd06f]"
            >
              Start matching
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/8 px-5 text-sm font-bold text-[#fff8ee] transition hover:bg-white/12"
            >
              Sign in
            </Link>
          </div>
          <dl className="mt-10 grid max-w-[350px] grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">
            {[
              ["2", "people first"],
              ["US", "providers"],
              ["Fast", "vibe check"],
            ].map(([value, label]) => (
              <div key={label} className="border-l border-white/12 pl-4">
                <dt className="text-xl font-black text-[#fff8ee] sm:text-2xl">
                  {value}
                </dt>
                <dd className="text-[11px] font-bold text-[#8793a6] sm:text-xs">
                  {label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <LandingPreview />
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section className="bg-[#0c111a] py-16 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <p className="text-xs font-bold uppercase text-[#f0b44c]">
            The actual job
          </p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-[#fff8ee] sm:text-4xl">
            Not another movie database. A decision app for the couch.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {differentiators.map((item) => (
            <article
              key={item}
              className="rounded-lg border border-white/12 bg-[#101722] p-5"
            >
              <Check className="mb-4 size-5 text-[#2dd4a7]" aria-hidden="true" />
              <p className="text-sm font-bold leading-6 text-[#d7dfeb]">{item}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="bg-[#090b11] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase text-[#f0b44c]">
            How v1 works
          </p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-[#fff8ee] sm:text-4xl">
            Three steps from “what should we watch?” to a real answer.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <article
                key={step.title}
                className="rounded-lg border border-white/12 bg-[#101722] p-5"
              >
                <div className="mb-8 flex items-center justify-between gap-4">
                  <span className="flex size-11 items-center justify-center rounded-lg bg-[#f0b44c] text-[#18100b]">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-black text-white/20">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="text-xl font-black text-[#fff8ee]">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#aeb7c7]">{step.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MatchPreviewSection() {
  return (
    <section className="bg-[#101722] py-16 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="grid grid-cols-[0.8fr_1fr] items-end gap-4">
          <PosterArt movie={matchMovie} compact className="aspect-[2/3]" />
          <article className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-5">
            <p className="mb-2 text-xs font-bold uppercase text-emerald-100">
              Perfect match
            </p>
            <h3 className="text-2xl font-black text-[#fff8ee]">
              {matchMovie.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#c5cedc]">
              You both liked music-driven dramas tonight.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {matchMovie.watch_providers.slice(0, 3).map((provider) => (
                <span
                  key={provider.id}
                  className="inline-flex h-8 items-center rounded-md border border-white/12 bg-black/20 px-3 text-xs font-bold text-[#fff8ee]"
                >
                  {provider.provider_name}
                </span>
              ))}
            </div>
          </article>
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-[#f0b44c]">
            Match reveal
          </p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-[#fff8ee] sm:text-4xl">
            Private swipes. Shared results. No awkward veto spiral.
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[#c5cedc] sm:text-base">
            VibeMatch only reveals a title when both people are interested. If
            there is no match, it suggests loosening the vibe instead of sending
            you back to endless browsing.
          </p>
        </div>
      </div>
    </section>
  );
}

function AvailabilitySection() {
  const providerGroups = backupMovie.watch_providers.reduce<
    Partial<Record<WatchProviderType, string[]>>
  >((groups, provider) => {
    groups[provider.provider_type] = [
      ...(groups[provider.provider_type] ?? []),
      provider.provider_name,
    ];

    return groups;
  }, {});

  return (
    <section className="bg-[#090b11] py-16 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase text-[#f0b44c]">
            Watch availability
          </p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-[#fff8ee] sm:text-4xl">
            “Where can we watch it?” stays part of the answer.
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[#c5cedc] sm:text-base">
            The MVP keeps streaming availability simple: United States only,
            grouped by stream, rent, buy, free, and ads. International switching
            can wait until the core matching loop earns it.
          </p>
        </div>
        <article className="rounded-lg border border-white/12 bg-[#101722] p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <PosterArt movie={backupMovie} compact className="aspect-[2/3] w-24 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-2xl font-black text-[#fff8ee]">
                {backupMovie.title}
              </h3>
              <p className="mt-1 text-xs font-bold text-[#f0b44c]">
                {releaseYear(backupMovie.release_date)} |{" "}
                {runtimeLabel(backupMovie.runtime_minutes)}
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            {(Object.keys(providerGroups) as WatchProviderType[]).map((type) => (
              <div key={type} className="flex flex-wrap items-center gap-3">
                <span className="w-16 text-xs font-bold uppercase text-[#8f9bad]">
                  {providerLabel[type]}
                </span>
                {providerGroups[type]?.map((name) => (
                  <span
                    key={name}
                    className="inline-flex h-8 items-center rounded-md border border-violet-300/20 bg-violet-300/12 px-3 text-xs font-bold text-violet-100"
                  >
                    {name}
                  </span>
                ))}
              </div>
            ))}
          </div>
          <p className="mt-5 flex items-center gap-2 text-xs font-bold text-[#7f8a9c]">
            <Clock3 className="size-4" aria-hidden="true" />
            Provider data is timestamped because rights change.
          </p>
        </article>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-[#0c111a] px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-lg bg-[#2dd4a7] text-[#061b16]">
          <Users className="size-6" aria-hidden="true" />
        </div>
        <h2 className="text-3xl font-black leading-tight text-[#fff8ee] sm:text-5xl">
          Make the first shared yes easier.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#c5cedc] sm:text-base">
          Start with two-person movie matching. Groups, richer recommendations,
          and watched-together ratings can build on top of a simple habit that
          already works.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#f0b44c] px-5 text-sm font-bold text-[#18100b] transition hover:bg-[#ffd06f]"
          >
            Create an account
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/8 px-5 text-sm font-bold text-[#fff8ee] transition hover:bg-white/12"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#090b11] text-[#fff8ee]">
      <HashReset />
      <Hero />
      <ProblemSection />
      <HowItWorksSection />
      <MatchPreviewSection />
      <AvailabilitySection />
      <FinalCta />
    </main>
  );
}
