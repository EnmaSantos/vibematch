import {
  type AnimationPreference,
  type MediaItem,
  type ReleaseAgePreference,
  type RuntimePreference,
  type SessionFilters,
  type VibeMood,
} from "@/lib/vibematch-data";

export const MOOD_OPTIONS: VibeMood[] = [
  "Cozy",
  "Funny",
  "Romantic",
  "Scary",
  "Intense",
  "Mind-bending",
  "Comfort watch",
  "Background watch",
  "Actually pay attention",
];

export const RUNTIME_OPTIONS: RuntimePreference[] = [
  "Under 90 minutes",
  "Under 2 hours",
  "Anything",
];

export const GENRE_OPTIONS = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Mystery",
  "Romance",
  "Science Fiction",
  "Sci-fi",
  "Thriller",
  "War",
  "Western",
];

export const RELEASE_AGE_OPTIONS: ReleaseAgePreference[] = [
  "New/recent",
  "Last 5 years",
  "2000s and newer",
  "90s and newer",
  "Classics are fine",
  "Any year",
];

export const ANIMATION_OPTIONS: AnimationPreference[] = [
  "Live action",
  "Animation",
  "Either",
];

export const DEFAULT_SESSION_FILTERS: SessionFilters = {
  moods: ["Cozy", "Funny"],
  runtime: "Anything",
  genres: [],
  releaseAge: "Any year",
  animationPreference: "Either",
};

export type TasteProfile = {
  likedGenres: Record<string, number>;
  skippedGenres: Record<string, number>;
  likedMovies: number;
  skippedMovies: number;
  lastMovieIds: string[];
};

export type ProfilePreferences = {
  favorite_genres?: string[] | null;
  mood_preferences?: string[] | null;
  runtime_preference?: string | null;
  release_age_preference?: string | null;
  animation_preference?: string | null;
  taste_profile?: Partial<TasteProfile> | null;
};

export type MatchParticipant = {
  id: string;
  displayName: string;
  role?: string;
};

export type MatchSwipe = {
  user_id: string;
  movie_id: string;
  intent: "like" | "skip";
  created_at?: string;
};

export type DynamicMatch = {
  movieId: string;
  movie?: MediaItem;
  matchType: "perfect" | "almost" | "saved-like";
  score: number;
  reason: string;
  likedBy: string[];
  skippedBy: string[];
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function optionOrDefault<T extends string>(
  value: unknown,
  options: readonly T[],
  fallback: T,
): T {
  return typeof value === "string" && options.includes(value as T)
    ? (value as T)
    : fallback;
}

export function normalizeTasteProfile(value: unknown): TasteProfile {
  const maybeProfile = value && typeof value === "object" ? (value as Partial<TasteProfile>) : {};

  return {
    likedGenres:
      maybeProfile.likedGenres && typeof maybeProfile.likedGenres === "object"
        ? maybeProfile.likedGenres
        : {},
    skippedGenres:
      maybeProfile.skippedGenres && typeof maybeProfile.skippedGenres === "object"
        ? maybeProfile.skippedGenres
        : {},
    likedMovies: Number(maybeProfile.likedMovies ?? 0),
    skippedMovies: Number(maybeProfile.skippedMovies ?? 0),
    lastMovieIds: asStringArray(maybeProfile.lastMovieIds).slice(-20),
  };
}

export function updateTasteProfile(
  currentProfile: unknown,
  genres: string[],
  movieId: string,
  intent: "like" | "skip",
): TasteProfile {
  const tasteProfile = normalizeTasteProfile(currentProfile);
  const target = intent === "like" ? tasteProfile.likedGenres : tasteProfile.skippedGenres;

  genres.forEach((genre) => {
    target[genre] = (target[genre] ?? 0) + 1;
  });

  if (intent === "like") {
    tasteProfile.likedMovies += 1;
  } else {
    tasteProfile.skippedMovies += 1;
  }

  tasteProfile.lastMovieIds = [
    ...tasteProfile.lastMovieIds.filter((id) => id !== movieId),
    movieId,
  ].slice(-20);

  return tasteProfile;
}

export function filtersFromProfile(profile?: ProfilePreferences | null): SessionFilters {
  if (!profile) return DEFAULT_SESSION_FILTERS;

  return {
    moods: asStringArray(profile.mood_preferences).filter((mood): mood is VibeMood =>
      MOOD_OPTIONS.includes(mood as VibeMood),
    ),
    runtime: optionOrDefault(
      profile.runtime_preference,
      RUNTIME_OPTIONS,
      DEFAULT_SESSION_FILTERS.runtime,
    ),
    genres: asStringArray(profile.favorite_genres).filter((genre) =>
      GENRE_OPTIONS.includes(genre),
    ),
    releaseAge: optionOrDefault(
      profile.release_age_preference,
      RELEASE_AGE_OPTIONS,
      DEFAULT_SESSION_FILTERS.releaseAge,
    ),
    animationPreference: optionOrDefault(
      profile.animation_preference,
      ANIMATION_OPTIONS,
      DEFAULT_SESSION_FILTERS.animationPreference,
    ),
  };
}

export function filtersFromUnknown(value: unknown): SessionFilters {
  if (!value || typeof value !== "object") return DEFAULT_SESSION_FILTERS;
  const filters = value as Partial<SessionFilters>;

  return {
    moods: asStringArray(filters.moods).filter((mood): mood is VibeMood =>
      MOOD_OPTIONS.includes(mood as VibeMood),
    ),
    runtime: optionOrDefault(filters.runtime, RUNTIME_OPTIONS, DEFAULT_SESSION_FILTERS.runtime),
    genres: asStringArray(filters.genres).filter((genre) => GENRE_OPTIONS.includes(genre)),
    releaseAge: optionOrDefault(
      filters.releaseAge,
      RELEASE_AGE_OPTIONS,
      DEFAULT_SESSION_FILTERS.releaseAge,
    ),
    animationPreference: optionOrDefault(
      filters.animationPreference,
      ANIMATION_OPTIONS,
      DEFAULT_SESSION_FILTERS.animationPreference,
    ),
  };
}

export function filtersFromFormData(formData: FormData): SessionFilters {
  return {
    moods: formData
      .getAll("moods")
      .map(String)
      .filter((mood): mood is VibeMood => MOOD_OPTIONS.includes(mood as VibeMood)),
    runtime: optionOrDefault(
      formData.get("runtime"),
      RUNTIME_OPTIONS,
      DEFAULT_SESSION_FILTERS.runtime,
    ),
    genres: formData
      .getAll("genres")
      .map(String)
      .filter((genre) => GENRE_OPTIONS.includes(genre)),
    releaseAge: optionOrDefault(
      formData.get("releaseAge"),
      RELEASE_AGE_OPTIONS,
      DEFAULT_SESSION_FILTERS.releaseAge,
    ),
    animationPreference: optionOrDefault(
      formData.get("animationPreference"),
      ANIMATION_OPTIONS,
      DEFAULT_SESSION_FILTERS.animationPreference,
    ),
  };
}

export function normalizeSessionCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function formatRuntime(seconds: number) {
  const minutes = Math.max(Math.round(seconds / 60), 1);
  return `${minutes} min`;
}

export function releaseYear(movie: Pick<MediaItem, "release_date">) {
  return movie.release_date ? new Date(movie.release_date).getFullYear() : 0;
}

function matchesRuntime(movie: MediaItem, runtime: RuntimePreference) {
  if (runtime === "Under 90 minutes") return movie.runtime_minutes < 90;
  if (runtime === "Under 2 hours") return movie.runtime_minutes <= 120;
  return true;
}

function matchesReleaseAge(movie: MediaItem, releaseAge: ReleaseAgePreference) {
  const year = releaseYear(movie);
  if (!year) return true;
  if (releaseAge === "New/recent") return year >= 2024;
  if (releaseAge === "Last 5 years") return year >= new Date().getFullYear() - 5;
  if (releaseAge === "2000s and newer") return year >= 2000;
  if (releaseAge === "90s and newer") return year >= 1990;
  return true;
}

function matchesAnimationPreference(movie: MediaItem, preference: AnimationPreference) {
  const isAnimated = movie.genres.some((genre) => genre === "Animation");
  if (preference === "Animation") return isAnimated;
  if (preference === "Live action") return !isAnimated;
  return true;
}

export function filterMoviesBySession(movies: MediaItem[], filters: SessionFilters) {
  const filtered = movies.filter((movie) => {
    const genreMatch =
      filters.genres.length === 0 ||
      movie.genres.some((genre) => filters.genres.includes(genre));

    return (
      genreMatch &&
      matchesRuntime(movie, filters.runtime) &&
      matchesReleaseAge(movie, filters.releaseAge) &&
      matchesAnimationPreference(movie, filters.animationPreference)
    );
  });

  return filtered.length > 0 ? filtered : movies;
}

export function scoreMovieForTaste(
  movie: MediaItem,
  filters: SessionFilters,
  tasteProfile: unknown,
) {
  const taste = normalizeTasteProfile(tasteProfile);
  const reasons: string[] = [];
  let score = Number(movie.tmdb_rating || 0) * 8;

  movie.genres.forEach((genre) => {
    if (filters.genres.includes(genre)) {
      score += 12;
      reasons.push(`${genre} filter`);
    }

    const likedWeight = taste.likedGenres[genre] ?? 0;
    const skippedWeight = taste.skippedGenres[genre] ?? 0;

    if (likedWeight > 0) {
      score += likedWeight * 5;
      reasons.push(`you have liked ${genre.toLowerCase()}`);
    }

    if (skippedWeight > 0) {
      score -= skippedWeight * 2.5;
    }
  });

  if (matchesRuntime(movie, filters.runtime)) score += 6;
  if (matchesReleaseAge(movie, filters.releaseAge)) score += 4;
  if (matchesAnimationPreference(movie, filters.animationPreference)) score += 3;
  if (taste.lastMovieIds.includes(movie.id)) score -= 12;

  return {
    score,
    reasons: [...new Set(reasons)].slice(0, 3),
  };
}

export function rankMoviesForUser(
  movies: MediaItem[],
  filters: SessionFilters,
  tasteProfile: unknown,
) {
  return filterMoviesBySession(movies, filters)
    .map((movie) => ({
      movie,
      taste: scoreMovieForTaste(movie, filters, tasteProfile),
    }))
    .sort((a, b) => b.taste.score - a.taste.score)
    .map(({ movie }) => movie);
}

export function pickRandomMovie(movies: MediaItem[]) {
  if (!movies.length) return null;
  return movies[Math.floor(Math.random() * movies.length)];
}

export function buildMovieMap(movies: MediaItem[]) {
  return new Map(movies.map((movie) => [movie.id, movie]));
}

export function buildDynamicMatches({
  currentUserId,
  movieMap,
  participants,
  swipes,
}: {
  currentUserId: string;
  movieMap: Map<string, MediaItem>;
  participants: MatchParticipant[];
  swipes: MatchSwipe[];
}): DynamicMatch[] {
  const participantNameById = new Map(
    participants.map((participant) => [participant.id, participant.displayName]),
  );
  const grouped = new Map<string, MatchSwipe[]>();

  swipes.forEach((swipe) => {
    grouped.set(swipe.movie_id, [...(grouped.get(swipe.movie_id) ?? []), swipe]);
  });

  return [...grouped.entries()]
    .flatMap(([movieId, movieSwipes]): DynamicMatch[] => {
      const likedUserIds = [
        ...new Set(movieSwipes.filter((swipe) => swipe.intent === "like").map((swipe) => swipe.user_id)),
      ];
      const skippedUserIds = [
        ...new Set(movieSwipes.filter((swipe) => swipe.intent === "skip").map((swipe) => swipe.user_id)),
      ];

      if (likedUserIds.length === 0) return [];

      const likedBy = likedUserIds.map((id) => participantNameById.get(id) ?? "Someone");
      const skippedBy = skippedUserIds.map((id) => participantNameById.get(id) ?? "Someone");
      const currentUserLiked = likedUserIds.includes(currentUserId);
      const matchType =
        likedUserIds.length > 1 ? "perfect" : skippedUserIds.length > 0 ? "almost" : "saved-like";
      const movie = movieMap.get(movieId);

      return [{
        movieId,
        ...(movie ? { movie } : {}),
        matchType,
        likedBy,
        skippedBy,
        score:
          matchType === "perfect"
            ? 100
            : matchType === "almost"
              ? 72
              : currentUserLiked
                ? 55
                : 45,
        reason:
          matchType === "perfect"
            ? `${likedBy.join(" and ")} both liked this.`
            : matchType === "almost"
              ? `${likedBy.join(", ")} liked it, but ${skippedBy.join(", ")} skipped.`
              : "Saved as one of your liked titles.",
      }];
    })
    .sort((a, b) => b.score - a.score);
}

export function topTasteGenres(tasteProfile: unknown, limit = 3) {
  const taste = normalizeTasteProfile(tasteProfile);

  return Object.entries(taste.likedGenres)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([genre]) => genre);
}
