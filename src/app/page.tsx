import type { CSSProperties } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  Eye,
  Film,
  Heart,
  KeyRound,
  Link2,
  Mail,
  Play,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Timer,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  activeFilters,
  friendships,
  liveSession,
  matches,
  movies,
  profiles,
  swipes,
  vibeQuestions,
  watchedTogether,
  type MediaItem,
  type WatchProvider,
  type WatchProviderType,
} from "@/lib/vibematch-data";
import { cn } from "@/lib/utils";

const currentMovie = movies[0];
const detailMovie = movies[2];
const perfectMatch = matches.find((match) => match.match_type === "perfect");
const perfectMovie = movies.find(
  (movie) => movie.id === perfectMatch?.media_item_id,
);
const almostMatches = matches
  .filter((match) => match.match_type === "almost")
  .map((match) => ({
    ...match,
    movie: movies.find((movie) => movie.id === match.media_item_id),
  }))
  .filter((match): match is typeof match & { movie: MediaItem } =>
    Boolean(match.movie),
  );

const appRoutes = [
  { label: "Home", href: "#landing" },
  { label: "Vibe", href: "#vibe-check" },
  { label: "Session", href: "#session" },
  { label: "Matches", href: "#matches" },
];

const dashboardActions: {
  title: string;
  detail: string;
  icon: LucideIcon;
  tone: string;
}[] = [
  {
    title: "Start Quick Swipe",
    detail: "Async picks whenever you have a minute",
    icon: Play,
    tone: "bg-[#f0b44c] text-[#18100b]",
  },
  {
    title: "Start Live Session",
    detail: "Invite one friend for a short round",
    icon: Timer,
    tone: "bg-[#2dd4a7] text-[#061b16]",
  },
  {
    title: "Join Session",
    detail: "Enter a code from a partner or roommate",
    icon: Link2,
    tone: "bg-[#c8b6ff] text-[#151026]",
  },
  {
    title: "View Matches",
    detail: "Perfect matches first, backups next",
    icon: Heart,
    tone: "bg-[#f17c67] text-[#210d0a]",
  },
  {
    title: "View Friends",
    detail: "Accepted friends only for v1",
    icon: Users,
    tone: "bg-[#8fd6ff] text-[#061725]",
  },
];

const providerTone: Record<WatchProviderType, string> = {
  stream: "border-emerald-300/20 bg-emerald-300/12 text-emerald-100",
  rent: "border-violet-300/20 bg-violet-300/12 text-violet-100",
  buy: "border-amber-300/20 bg-amber-300/12 text-amber-100",
  free: "border-sky-300/20 bg-sky-300/12 text-sky-100",
  ads: "border-rose-300/20 bg-rose-300/12 text-rose-100",
};

function runtimeLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (!hours) {
    return `${remainder}m`;
  }

  return `${hours}h ${remainder}m`;
}

function releaseYear(releaseDate: string) {
  return new Date(releaseDate).getFullYear();
}

function providerDate(provider: WatchProvider) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(provider.last_checked_at));
}

function providerSummary(movie: MediaItem, type: WatchProviderType) {
  return movie.watch_providers
    .filter((provider) => provider.provider_type === type)
    .map((provider) => provider.provider_name)
    .join(", ");
}

function ButtonLink({
  href,
  children,
  icon: Icon,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  icon: LucideIcon;
  variant?: "primary" | "secondary";
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f0b44c]",
        variant === "primary"
          ? "bg-[#f0b44c] text-[#18100b] hover:bg-[#ffd06f]"
          : "border border-white/15 bg-white/8 text-[#fff8ee] hover:bg-white/12",
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      {children}
    </a>
  );
}

function SectionHeader({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="mx-auto mb-10 flex w-full max-w-5xl flex-col gap-4 px-5 sm:px-8">
      <p className="text-xs font-bold uppercase text-[#f0b44c]">{eyebrow}</p>
      <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(280px,0.7fr)] md:items-end">
        <h2 className="max-w-2xl text-3xl font-black leading-[1.08] text-[#fff8ee] sm:text-4xl">
          {title}
        </h2>
        <p className="max-w-xl text-sm leading-6 text-[#aeb7c7] sm:text-base">
          {copy}
        </p>
      </div>
    </div>
  );
}

function ProviderPill({ provider }: { provider: WatchProvider }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center rounded-md border px-3 text-xs font-bold",
        providerTone[provider.provider_type],
      )}
    >
      {provider.provider_name}
    </span>
  );
}

function FilterPill({
  children,
  selected = false,
}: {
  children: React.ReactNode;
  selected?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-9 items-center rounded-full border px-3 py-2 text-xs font-bold",
        selected
          ? "border-[#f0b44c] bg-[#f0b44c] text-[#18100b]"
          : "border-white/12 bg-white/7 text-[#d7dfeb]",
      )}
    >
      {children}
    </span>
  );
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
      <div className="absolute inset-x-4 top-5 h-4 rounded-full bg-white/18" />
      <div className="absolute right-6 top-12 size-16 rounded-full border border-white/25 bg-white/15" />
      <div className="absolute inset-x-6 bottom-20 h-1.5 rounded-full bg-white/30" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-5">
        <p
          className={cn(
            "font-black leading-tight text-white",
            compact ? "text-sm" : "text-2xl",
          )}
        >
          {movie.title}
        </p>
        {!compact ? (
          <p className="mt-2 text-xs font-bold text-white/75">
            {releaseYear(movie.release_date)} | {movie.genres.join(", ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function MovieMeta({ movie }: { movie: MediaItem }) {
  return (
    <p className="text-xs font-bold text-[#f0b44c] sm:text-sm">
      {releaseYear(movie.release_date)} | {runtimeLabel(movie.runtime_minutes)} |{" "}
      {movie.genres.join(", ")}
    </p>
  );
}

function PhoneShell({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="mx-auto w-full max-w-[390px] rounded-[32px] border border-white/14 bg-[#080a12] p-3 shadow-2xl shadow-black/40">
      <div className="rounded-[24px] border border-white/10 bg-[#0c111a]">
        <div className="flex h-11 items-center justify-between px-5">
          <span className="text-xs font-bold text-[#f0b44c]">{title}</span>
          <span className="h-1.5 w-16 rounded-full bg-white/18" />
        </div>
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  );
}

function SwipeCard({ movie }: { movie: MediaItem }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/12 bg-[#101722] shadow-xl shadow-black/25">
      <PosterArt movie={movie} className="aspect-[3/4] rounded-none border-0" />
      <div className="space-y-4 p-4">
        <div>
          <h3 className="text-2xl font-black leading-tight text-[#fff8ee]">
            {movie.title}
          </h3>
          <MovieMeta movie={movie} />
        </div>
        <p className="text-sm leading-6 text-[#b9c1cf]">{movie.overview}</p>
        <div className="flex flex-wrap gap-2">
          {movie.watch_providers.map((provider) => (
            <ProviderPill key={provider.id} provider={provider} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-rose-200/15 bg-rose-300/10 text-sm font-bold text-rose-100"
          >
            <X className="size-4" aria-hidden="true" />
            Skip
          </button>
          <button
            type="button"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-emerald-200/15 bg-emerald-300/14 text-sm font-bold text-emerald-100"
          >
            <Heart className="size-4" aria-hidden="true" />
            Like
          </button>
        </div>
      </div>
    </div>
  );
}

function HeroPreview() {
  return (
    <PhoneShell title="Live round | 00:42">
      <SwipeCard movie={currentMovie} />
    </PhoneShell>
  );
}

function HeroSection() {
  return (
    <section
      id="landing"
      className="relative isolate overflow-hidden bg-[#090b11] px-5 py-5 sm:px-8"
    >
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,#2b1117_0%,#0a111d_45%,#11120d_100%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-24 bg-[repeating-linear-gradient(90deg,rgba(255,248,238,0.12)_0,rgba(255,248,238,0.12)_1px,transparent_1px,transparent_34px)] opacity-40" />
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 py-2">
        <a href="#landing" className="inline-flex items-center gap-2 font-black text-[#fff8ee]">
          <span className="flex size-9 items-center justify-center rounded-lg bg-[#f0b44c] text-[#18100b]">
            <Film className="size-5" aria-hidden="true" />
          </span>
          VibeMatch
        </a>
        <nav className="hidden items-center gap-2 rounded-full border border-white/12 bg-black/20 p-1 md:flex">
          {appRoutes.map((route) => (
            <a
              key={route.href}
              href={route.href}
              className="rounded-full px-4 py-2 text-xs font-bold text-[#cbd3df] hover:bg-white/8 hover:text-white"
            >
              {route.label}
            </a>
          ))}
        </nav>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl items-center gap-10 pb-14 pt-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.8fr)]">
        <div className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#f0b44c]/25 bg-[#f0b44c]/10 px-3 py-2 text-xs font-bold text-[#ffd98a]">
            <Sparkles className="size-4" aria-hidden="true" />
            US movie availability for v1
          </div>
          <h1 className="text-5xl font-black leading-[1.02] text-[#fff8ee] sm:text-6xl lg:text-7xl">
            Stop scrolling.
            <br />
            Start matching.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#c5cedc] sm:text-lg">
            VibeMatch helps friends and partners find movies they both actually
            want to watch.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="#vibe-check" icon={SlidersHorizontal}>
              Start a vibe check
            </ButtonLink>
            <ButtonLink href="#session" icon={Link2} variant="secondary">
              Join with a code
            </ButtonLink>
          </div>
          <dl className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {[
              ["2", "people first"],
              ["60s", "live round"],
              ["US", "providers"],
            ].map(([value, label]) => (
              <div key={label} className="border-l border-white/12 pl-4">
                <dt className="text-2xl font-black text-[#fff8ee]">{value}</dt>
                <dd className="text-xs font-bold text-[#8793a6]">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <HeroPreview />
      </div>
    </section>
  );
}

function AuthDashboardSection() {
  const acceptedFriend = friendships.find((friendship) => friendship.status === "accepted");
  const friend = profiles.find(
    (profile) => profile.id === acceptedFriend?.addressee_id,
  );

  return (
    <section id="dashboard" className="bg-[#0c111a] py-20 sm:py-24">
      <SectionHeader
        eyebrow="Web MVP surface"
        title="The first app shell keeps every core route visible."
        copy="The prototype models auth, dashboard actions, friends, sessions, matches, and a path into the vibe check without waiting on backend wiring."
      />
      <div className="mx-auto grid max-w-5xl gap-5 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.2fr_0.9fr]">
        <form className="rounded-lg border border-white/12 bg-[#101722] p-5">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-[#f0b44c] text-[#18100b]">
              <Mail className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-black text-[#fff8ee]">Email sign in</h3>
              <p className="text-xs text-[#8f9bad]">Supabase Auth target</p>
            </div>
          </div>
          <label className="mb-3 block text-xs font-bold text-[#f0b44c]" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="mb-4 h-12 w-full rounded-lg border border-white/12 bg-black/20 px-3 text-sm text-[#fff8ee] outline-none"
            defaultValue="you@example.com"
            readOnly
          />
          <label
            className="mb-3 block text-xs font-bold text-[#f0b44c]"
            htmlFor="password"
          >
            Password
          </label>
          <div className="mb-5 flex h-12 items-center gap-2 rounded-lg border border-white/12 bg-black/20 px-3 text-sm text-[#fff8ee]">
            <KeyRound className="size-4 text-[#8f9bad]" aria-hidden="true" />
            <span aria-label="Hidden password">**********</span>
          </div>
          <button
            type="button"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#f0b44c] text-sm font-bold text-[#18100b]"
          >
            <ArrowRight className="size-4" aria-hidden="true" />
            Sign in
          </button>
        </form>

        <div className="grid gap-3">
          {dashboardActions.map((action) => {
            const Icon = action.icon;

            return (
              <article
                key={action.title}
                className="flex min-h-20 items-center gap-4 rounded-lg border border-white/12 bg-[#111722] p-4"
              >
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-lg",
                    action.tone,
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-black text-[#fff8ee]">{action.title}</h3>
                  <p className="text-sm leading-5 text-[#aeb7c7]">{action.detail}</p>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="rounded-lg border border-white/12 bg-[#101722] p-5">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-[#2dd4a7] text-[#061b16]">
              <UserPlus className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-black text-[#fff8ee]">Friends</h3>
              <p className="text-xs text-[#8f9bad]">Partners first</p>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-[#8fd6ff] text-sm font-black text-[#061725]">
                {friend?.avatar_initials ?? "AR"}
              </span>
              <div>
                <p className="font-bold text-[#fff8ee]">
                  {friend?.display_name ?? "Alex Rivera"}
                </p>
                <p className="text-xs text-[#8f9bad]">Accepted friend</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/8 text-sm font-bold text-[#fff8ee]"
          >
            <Search className="size-4" aria-hidden="true" />
            Add by email
          </button>
        </aside>
      </div>
    </section>
  );
}

function VibeCheckSection() {
  return (
    <section id="vibe-check" className="bg-[#090b11] py-20 sm:py-24">
      <SectionHeader
        eyebrow="Vibe check"
        title="Fast filters that feel lighter than homework."
        copy="Each question can be skipped. The MVP starts with mood, runtime, genre, release age, and animation or live action."
      />
      <div className="mx-auto grid max-w-5xl gap-5 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-lg border border-white/12 bg-[#101722] p-5 sm:p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[#f0b44c]">Question 1 of 5</p>
              <h3 className="mt-2 text-2xl font-black text-[#fff8ee]">
                How should this movie feel?
              </h3>
            </div>
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/12 px-3 text-xs font-bold text-[#d7dfeb]"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Skip
            </button>
          </div>
          <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[34%] rounded-full bg-[#f0b44c]" />
          </div>
          <div className="flex flex-wrap gap-2.5">
            {vibeQuestions[0].options.map((option) => (
              <FilterPill
                key={option}
                selected={vibeQuestions[0].selected.includes(option)}
              >
                {option}
              </FilterPill>
            ))}
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#f0b44c] text-sm font-bold text-[#18100b]"
            >
              <Check className="size-4" aria-hidden="true" />
              Continue
            </button>
            <button
              type="button"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/8 text-sm font-bold text-[#fff8ee]"
            >
              <X className="size-4" aria-hidden="true" />
              Clear mood
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          {vibeQuestions.slice(1).map((question) => (
            <article
              key={question.label}
              className="rounded-lg border border-white/12 bg-[#111722] p-4"
            >
              <h3 className="mb-3 font-black text-[#fff8ee]">{question.label}</h3>
              <div className="flex flex-wrap gap-2">
                {question.options.slice(0, 5).map((option) => (
                  <FilterPill key={option} selected={question.selected.includes(option)}>
                    {option}
                  </FilterPill>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SessionSection() {
  return (
    <section id="session" className="bg-[#101722] py-20 sm:py-24">
      <SectionHeader
        eyebrow="Live session"
        title="Two people join, swipe for a short round, then see shared yeses."
        copy="This static prototype shows the first live-session loop: friend, duration, code, timer, movie card, and private like or skip."
      />
      <div className="mx-auto grid max-w-5xl items-start gap-6 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-4">
          <article className="rounded-lg border border-white/12 bg-[#0c111a] p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-[#f0b44c]">Session code</p>
                <h3 className="mt-2 text-3xl font-black text-[#fff8ee]">
                  {liveSession.code}
                </h3>
              </div>
              <button
                type="button"
                className="flex size-11 items-center justify-center rounded-lg border border-white/12 bg-white/8 text-[#fff8ee]"
                aria-label="Copy session code"
              >
                <Copy className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[30, 60, 180].map((duration) => (
                <span
                  key={duration}
                  className={cn(
                    "flex h-10 items-center justify-center rounded-full border text-xs font-bold",
                    duration === liveSession.duration_seconds
                      ? "border-[#f0b44c] bg-[#f0b44c] text-[#18100b]"
                      : "border-white/12 bg-white/7 text-[#d7dfeb]",
                  )}
                >
                  {duration === 180 ? "3 min" : `${duration}s`}
                </span>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-white/12 bg-[#0c111a] p-5">
            <h3 className="mb-4 font-black text-[#fff8ee]">Current filters</h3>
            <div className="flex flex-wrap gap-2">
              {[
                ...activeFilters.moods,
                activeFilters.runtime,
                ...activeFilters.genres,
                activeFilters.releaseAge,
                activeFilters.animationPreference,
              ].map((filter) => (
                <FilterPill key={filter} selected>
                  {filter}
                </FilterPill>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-white/12 bg-[#0c111a] p-5">
            <h3 className="mb-4 font-black text-[#fff8ee]">Live signals</h3>
            <div className="grid gap-3">
              {profiles.map((profile, index) => (
                <div key={profile.id} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-3 text-sm font-bold text-[#d7dfeb]">
                    <span className="flex size-9 items-center justify-center rounded-full bg-white/10 text-xs text-[#fff8ee]">
                      {profile.avatar_initials}
                    </span>
                    {profile.display_name}
                  </span>
                  <span className="rounded-full bg-emerald-300/12 px-3 py-1 text-xs font-bold text-emerald-100">
                    {index === 0 ? "You liked 4" : "Swiping"}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </div>

        <PhoneShell title="Live round | 00:42">
          <SwipeCard movie={currentMovie} />
        </PhoneShell>
      </div>
    </section>
  );
}

function DetailsSection() {
  const firstProvider = detailMovie.watch_providers[0];

  return (
    <section id="details" className="bg-[#090b11] py-20 sm:py-24">
      <SectionHeader
        eyebrow="Movie details"
        title="Every card answers: where can I watch this in the US?"
        copy="Provider data is modeled with country, type, and freshness so the later API sync can update availability without muddying movie metadata."
      />
      <div className="mx-auto grid max-w-5xl gap-6 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr]">
        <PosterArt movie={detailMovie} className="aspect-[4/5] min-h-[420px]" />
        <article className="rounded-lg border border-white/12 bg-[#101722] p-5 sm:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-3xl font-black text-[#fff8ee]">{detailMovie.title}</h3>
              <MovieMeta movie={detailMovie} />
            </div>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/8 px-4 text-sm font-bold text-[#fff8ee]"
            >
              <Eye className="size-4" aria-hidden="true" />
              Details
            </button>
          </div>

          <p className="max-w-2xl text-sm leading-7 text-[#c5cedc]">
            {detailMovie.overview}
          </p>

          <div className="my-6 grid gap-3 sm:grid-cols-4">
            {[
              ["TMDB", detailMovie.tmdb_rating.toFixed(1)],
              ["IMDb", detailMovie.imdb_rating.toFixed(1)],
              ["RT", detailMovie.rotten_tomatoes_rating ?? "n/a"],
              ["Meta", String(detailMovie.metacritic_rating ?? "n/a")],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-white/10 bg-black/20 p-4"
              >
                <p className="text-xs font-bold text-[#8f9bad]">{label}</p>
                <p className="mt-2 text-xl font-black text-[#fff8ee]">{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-white/12 bg-[#0c111a] p-5">
            <h4 className="mb-4 font-black text-[#fff8ee]">
              Where to watch in the US
            </h4>
            <div className="grid gap-4">
              {(["stream", "rent", "buy"] as WatchProviderType[]).map((type) => {
                const names = providerSummary(detailMovie, type);

                return (
                  <div key={type} className="flex flex-wrap items-center gap-3">
                    <span className="w-16 text-xs font-bold uppercase text-[#8f9bad]">
                      {type}
                    </span>
                    {names ? (
                      detailMovie.watch_providers
                        .filter((provider) => provider.provider_type === type)
                        .map((provider) => (
                          <ProviderPill key={provider.id} provider={provider} />
                        ))
                    ) : (
                      <span className="text-sm text-[#8f9bad]">No provider listed</span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-5 text-xs font-bold text-[#7f8a9c]">
              US watch providers last updated: {providerDate(firstProvider)}
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}

function MatchesSection() {
  return (
    <section id="matches" className="bg-[#101722] py-20 sm:py-24">
      <SectionHeader
        eyebrow="Match reveal"
        title="Perfect matches, almost matches, and a graceful no-match path."
        copy="The first recommendation layer can be rule-based: previous likes, skipped movies, filters, genres, and watched-together ratings."
      />
      <div className="mx-auto grid max-w-5xl gap-6 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {perfectMovie && perfectMatch ? (
            <article className="grid gap-5 rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-5 sm:grid-cols-[140px_minmax(0,1fr)]">
              <PosterArt movie={perfectMovie} compact className="aspect-[2/3]" />
              <div>
                <p className="mb-2 text-xs font-bold text-emerald-100">
                  Perfect match
                </p>
                <h3 className="text-3xl font-black text-[#fff8ee]">
                  {perfectMovie.title}
                </h3>
                <MovieMeta movie={perfectMovie} />
                <p className="mt-4 text-sm leading-6 text-[#c5cedc]">
                  {perfectMatch.reason}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {perfectMovie.watch_providers.slice(0, 3).map((provider) => (
                    <ProviderPill key={provider.id} provider={provider} />
                  ))}
                </div>
              </div>
            </article>
          ) : null}

          <div className="grid gap-3">
            {almostMatches.map((match) => (
              <article
                key={match.id}
                className="grid grid-cols-[72px_minmax(0,1fr)_64px] items-center gap-4 rounded-lg border border-white/12 bg-[#0c111a] p-4"
              >
                <PosterArt movie={match.movie} compact className="aspect-[2/3]" />
                <div className="min-w-0">
                  <h3 className="font-black text-[#fff8ee]">{match.movie.title}</h3>
                  <p className="mt-1 text-sm leading-5 text-[#aeb7c7]">{match.reason}</p>
                </div>
                <p className="text-right text-lg font-black text-[#f0b44c]">
                  {match.score}%
                </p>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <article className="rounded-lg border border-white/12 bg-[#0c111a] p-5">
            <h3 className="mb-3 flex items-center gap-2 font-black text-[#fff8ee]">
              <Star className="size-5 text-[#f0b44c]" aria-hidden="true" />
              Later in MVP+
            </h3>
            <p className="text-sm leading-6 text-[#aeb7c7]">
              Personal ratings and watched-together ratings let VibeMatch learn
              relationship taste, not just individual taste.
            </p>
            <div className="mt-5 grid gap-3">
              {watchedTogether[0].vibe_tags.map((tag) => (
                <FilterPill key={tag}>{tag}</FilterPill>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-rose-300/20 bg-rose-300/10 p-5">
            <h3 className="font-black text-[#fff8ee]">No matches yet?</h3>
            <p className="mt-3 text-sm leading-6 text-[#e7c5c8]">
              Loosen the vibe: add more genres, allow longer movies, include older
              releases, or start another round.
            </p>
            <button
              type="button"
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-rose-200/20 bg-black/20 text-sm font-bold text-rose-100"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Start another round
            </button>
          </article>
        </aside>
      </div>
    </section>
  );
}

function DataShapeSection() {
  const liked = swipes.filter((swipe) => swipe.intent === "like").length;

  return (
    <section className="bg-[#090b11] py-16">
      <div className="mx-auto grid max-w-5xl gap-4 px-5 sm:px-8 md:grid-cols-4">
        {[
          ["media_items", `${movies.length} mock movies`],
          ["watch_providers", "country_code = US"],
          ["swipes", `${liked} likes modeled`],
          ["watched_together", "shared rating ready"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-white/12 bg-[#101722] p-4">
            <p className="text-xs font-bold text-[#8f9bad]">{label}</p>
            <p className="mt-2 text-lg font-black text-[#fff8ee]">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#090b11] text-[#fff8ee]">
      <HeroSection />
      <AuthDashboardSection />
      <VibeCheckSection />
      <SessionSection />
      <DetailsSection />
      <MatchesSection />
      <DataShapeSection />
    </main>
  );
}
