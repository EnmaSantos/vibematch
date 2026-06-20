export type WatchProviderType = "stream" | "rent" | "buy" | "free" | "ads";

export type WatchProvider = {
  id: string;
  media_item_id: string;
  country_code: "US";
  provider_name: string;
  provider_type: WatchProviderType;
  provider_logo_url?: string;
  last_checked_at: string;
};

export type MediaItem = {
  id: string;
  tmdb_id: number;
  imdb_id: string;
  title: string;
  overview: string;
  poster_url: string;
  backdrop_url: string;
  release_date: string;
  runtime_minutes: number;
  genres: string[];
  tmdb_rating: number;
  imdb_rating: number;
  rotten_tomatoes_rating?: string;
  metacritic_rating?: number;
  recommendationKind?: "wildcard";
  created_at: string;
  updated_at: string;
  posterTheme: {
    from: string;
    via: string;
    to: string;
  };
  watch_providers: WatchProvider[];
};

export type VibeMood =
  | "Cozy"
  | "Funny"
  | "Romantic"
  | "Scary"
  | "Intense"
  | "Mind-bending"
  | "Comfort watch"
  | "Background watch"
  | "Actually pay attention";

export type RuntimePreference = "Under 90 minutes" | "Under 2 hours" | "Anything";

export type ReleaseAgePreference =
  | "New/recent"
  | "Last 5 years"
  | "2000s and newer"
  | "90s and newer"
  | "Classics are fine"
  | "Any year";

export type AnimationPreference = "Live action" | "Animation" | "Either";

export type SessionFilters = {
  moods: VibeMood[];
  runtime: RuntimePreference;
  genres: string[];
  releaseAge: ReleaseAgePreference;
  animationPreference: AnimationPreference;
};

export type Profile = {
  id: string;
  display_name: string;
  email: string;
  avatar_initials: string;
};

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "blocked";
  created_at: string;
};

export type Swipe = {
  id: string;
  user_id: string;
  session_id: string;
  media_item_id: string;
  intent: "like" | "skip";
  created_at: string;
};

export type VibeMatchSession = {
  id: string;
  code: string;
  title: string;
  duration_seconds: number;
  status: "draft" | "live" | "complete";
  participants: Profile[];
  filters: SessionFilters;
};

export type MatchResult = {
  id: string;
  session_id: string;
  media_item_id: string;
  match_type: "perfect" | "almost" | "no-match-suggestion";
  reason: string;
  score: number;
};

export type MovieRating = {
  id: string;
  user_id: string;
  media_item_id: string;
  rating: number;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type WatchedTogether = {
  id: string;
  media_item_id: string;
  friendship_id: string;
  session_id: string;
  watched_at: string;
  shared_rating: number;
  vibe_tags: string[];
  notes?: string;
  created_at: string;
};

const checkedAt = "2026-06-15T10:00:00-06:00";

const provider = (
  id: string,
  mediaItemId: string,
  provider_name: string,
  provider_type: WatchProviderType,
): WatchProvider => ({
  id,
  media_item_id: mediaItemId,
  country_code: "US",
  provider_name,
  provider_type,
  last_checked_at: checkedAt,
});

export const profiles: Profile[] = [
  {
    id: "profile-enma",
    display_name: "Enma",
    email: "enma@example.com",
    avatar_initials: "ES",
  },
  {
    id: "profile-alex",
    display_name: "Alex Rivera",
    email: "alex@example.com",
    avatar_initials: "AR",
  },
];

export const friendships: Friendship[] = [
  {
    id: "friendship-enma-alex",
    requester_id: "profile-enma",
    addressee_id: "profile-alex",
    status: "accepted",
    created_at: "2026-06-10T19:24:00-06:00",
  },
];

export const movies: MediaItem[] = [
  {
    id: "media-midnight-radio",
    tmdb_id: 900001,
    imdb_id: "tt9000001",
    title: "Midnight Radio",
    overview:
      "Two old friends tune into a broadcast that seems to know what they will do next.",
    poster_url: "/mock-posters/midnight-radio",
    backdrop_url: "/mock-backdrops/midnight-radio",
    release_date: "2022-10-07",
    runtime_minutes: 107,
    genres: ["Mystery", "Sci-fi"],
    tmdb_rating: 7.8,
    imdb_rating: 7.9,
    rotten_tomatoes_rating: "92%",
    metacritic_rating: 81,
    created_at: "2026-06-15T10:00:00-06:00",
    updated_at: "2026-06-15T10:00:00-06:00",
    posterTheme: {
      from: "#2d1b69",
      via: "#8a3ffc",
      to: "#f05d5e",
    },
    watch_providers: [
      provider("provider-midnight-netflix", "media-midnight-radio", "Netflix", "stream"),
      provider("provider-midnight-apple-rent", "media-midnight-radio", "Apple TV", "rent"),
      provider("provider-midnight-amazon-buy", "media-midnight-radio", "Amazon", "buy"),
    ],
  },
  {
    id: "media-elvis",
    tmdb_id: 614934,
    imdb_id: "tt3704428",
    title: "Elvis",
    overview:
      "A dazzling music biopic about fame, family, spectacle, and the uneasy cost of becoming an icon.",
    poster_url: "/mock-posters/elvis",
    backdrop_url: "/mock-backdrops/elvis",
    release_date: "2022-06-24",
    runtime_minutes: 159,
    genres: ["Music", "Drama"],
    tmdb_rating: 7.5,
    imdb_rating: 7.3,
    rotten_tomatoes_rating: "77%",
    metacritic_rating: 64,
    created_at: "2026-06-15T10:00:00-06:00",
    updated_at: "2026-06-15T10:00:00-06:00",
    posterTheme: {
      from: "#32120f",
      via: "#b9472f",
      to: "#f2b84b",
    },
    watch_providers: [
      provider("provider-elvis-max", "media-elvis", "Max", "stream"),
      provider("provider-elvis-youtube-rent", "media-elvis", "YouTube", "rent"),
      provider("provider-elvis-amazon-buy", "media-elvis", "Amazon", "buy"),
    ],
  },
  {
    id: "media-past-lives",
    tmdb_id: 666277,
    imdb_id: "tt13238346",
    title: "Past Lives",
    overview:
      "Two childhood friends reunite in New York and quietly consider the lives they might have shared.",
    poster_url: "/mock-posters/past-lives",
    backdrop_url: "/mock-backdrops/past-lives",
    release_date: "2023-06-02",
    runtime_minutes: 106,
    genres: ["Romance", "Drama"],
    tmdb_rating: 7.8,
    imdb_rating: 7.9,
    rotten_tomatoes_rating: "95%",
    metacritic_rating: 94,
    created_at: "2026-06-15T10:00:00-06:00",
    updated_at: "2026-06-15T10:00:00-06:00",
    posterTheme: {
      from: "#113542",
      via: "#3d7e8f",
      to: "#f4b08b",
    },
    watch_providers: [
      provider("provider-past-lives-max", "media-past-lives", "Max", "stream"),
      provider("provider-past-lives-apple-rent", "media-past-lives", "Apple TV", "rent"),
      provider("provider-past-lives-amazon-buy", "media-past-lives", "Amazon", "buy"),
    ],
  },
  {
    id: "media-arrival",
    tmdb_id: 329865,
    imdb_id: "tt2543164",
    title: "Arrival",
    overview:
      "A linguist races to communicate with visitors whose arrival changes humanity's sense of time.",
    poster_url: "/mock-posters/arrival",
    backdrop_url: "/mock-backdrops/arrival",
    release_date: "2016-11-11",
    runtime_minutes: 116,
    genres: ["Sci-fi", "Drama"],
    tmdb_rating: 7.6,
    imdb_rating: 7.9,
    rotten_tomatoes_rating: "94%",
    metacritic_rating: 81,
    created_at: "2026-06-15T10:00:00-06:00",
    updated_at: "2026-06-15T10:00:00-06:00",
    posterTheme: {
      from: "#0f1e2b",
      via: "#405a70",
      to: "#e2cda7",
    },
    watch_providers: [
      provider("provider-arrival-paramount", "media-arrival", "Paramount+", "stream"),
      provider("provider-arrival-apple-rent", "media-arrival", "Apple TV", "rent"),
      provider("provider-arrival-youtube-buy", "media-arrival", "YouTube", "buy"),
    ],
  },
];

export const activeFilters: SessionFilters = {
  moods: ["Cozy", "Mind-bending", "Actually pay attention"],
  runtime: "Under 2 hours",
  genres: ["Comedy", "Sci-fi", "Mystery"],
  releaseAge: "2000s and newer",
  animationPreference: "Either",
};

export const liveSession: VibeMatchSession = {
  id: "session-vibe-284",
  code: "VIBE-284",
  title: "Friday couch round",
  duration_seconds: 60,
  status: "live",
  participants: profiles,
  filters: activeFilters,
};

export const swipes: Swipe[] = [
  {
    id: "swipe-1",
    user_id: "profile-enma",
    session_id: liveSession.id,
    media_item_id: "media-midnight-radio",
    intent: "like",
    created_at: "2026-06-15T20:02:00-06:00",
  },
  {
    id: "swipe-2",
    user_id: "profile-alex",
    session_id: liveSession.id,
    media_item_id: "media-elvis",
    intent: "like",
    created_at: "2026-06-15T20:02:20-06:00",
  },
];

export const matches: MatchResult[] = [
  {
    id: "match-elvis",
    session_id: liveSession.id,
    media_item_id: "media-elvis",
    match_type: "perfect",
    reason: "You both liked a music drama with big emotional energy.",
    score: 100,
  },
  {
    id: "match-arrival",
    session_id: liveSession.id,
    media_item_id: "media-arrival",
    match_type: "almost",
    reason: "Alex liked it, you skipped. It still fits the mind-bending filter.",
    score: 85,
  },
  {
    id: "match-past-lives",
    session_id: liveSession.id,
    media_item_id: "media-past-lives",
    match_type: "almost",
    reason: "You liked it, Alex skipped. Strong backup for a quieter night.",
    score: 78,
  },
];

export const movieRatings: MovieRating[] = [
  {
    id: "rating-past-lives-enma",
    user_id: "profile-enma",
    media_item_id: "media-past-lives",
    rating: 9,
    notes: "Beautiful, quiet, and worth full attention.",
    created_at: "2026-06-12T21:10:00-06:00",
    updated_at: "2026-06-12T21:10:00-06:00",
  },
];

export const watchedTogether: WatchedTogether[] = [
  {
    id: "watched-elvis-together",
    media_item_id: "media-elvis",
    friendship_id: "friendship-enma-alex",
    session_id: liveSession.id,
    watched_at: "2026-06-15T21:00:00-06:00",
    shared_rating: 8,
    vibe_tags: ["Good partner watch", "Funny together", "Great group movie"],
    notes: "Big reactions made it more fun together.",
    created_at: "2026-06-15T23:40:00-06:00",
  },
];

export const vibeQuestions = [
  {
    label: "Mood",
    options: [
      "Cozy",
      "Funny",
      "Romantic",
      "Scary",
      "Intense",
      "Mind-bending",
      "Comfort watch",
      "Background watch",
      "Actually pay attention",
    ],
    selected: ["Cozy", "Mind-bending", "Actually pay attention"],
  },
  {
    label: "Runtime",
    options: ["Under 90 minutes", "Under 2 hours", "Anything"],
    selected: ["Under 2 hours"],
  },
  {
    label: "Genre",
    options: [
      "Comedy",
      "Drama",
      "Horror",
      "Thriller",
      "Romance",
      "Sci-fi",
      "Fantasy",
      "Action",
      "Mystery",
      "Documentary",
      "Adventure",
    ],
    selected: ["Comedy", "Sci-fi", "Mystery"],
  },
  {
    label: "Release age",
    options: [
      "New/recent",
      "Last 5 years",
      "2000s and newer",
      "90s and newer",
      "Classics are fine",
      "Any year",
    ],
    selected: ["2000s and newer"],
  },
  {
    label: "Animation / live action",
    options: ["Live action", "Animation", "Either"],
    selected: ["Either"],
  },
];
