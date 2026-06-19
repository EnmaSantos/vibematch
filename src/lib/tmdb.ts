import { genresForMoods } from "./vibe-session";
import { MediaItem, type SessionFilters, WatchProvider } from "./vibematch-data";
import { createClient } from "./supabase/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY || "2a5662c07df906f2c0bb24debbe87e8f";
const BASE_URL = "https://api.themoviedb.org/3";

type TmdbGenre = number | { name?: string };

type TmdbMoviePayload = {
  id: number;
  title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  runtime?: number;
  imdb_id?: string;
  genre_ids?: number[];
  genres?: TmdbGenre[];
  "watch/providers"?: TmdbWatchProviderResponse;
};

type TmdbWatchProvider = {
  provider_id: number;
  provider_name: string;
  logo_path?: string | null;
};

type TmdbWatchProviderRegion = {
  flatrate?: TmdbWatchProvider[];
  rent?: TmdbWatchProvider[];
  buy?: TmdbWatchProvider[];
  free?: TmdbWatchProvider[];
  ads?: TmdbWatchProvider[];
};

type TmdbWatchProviderResponse = {
  results?: {
    US?: TmdbWatchProviderRegion;
  };
};

type TmdbMovieListResponse = {
  results?: TmdbMoviePayload[];
};

// Preset gradients for movie genres to maintain VibeMatch's gorgeous styling
const GENRE_GRADIENTS: Record<string, { from: string; via: string; to: string }> = {
  Action: { from: "#3b0808", via: "#991b1b", to: "#ea580c" }, // Deep red to orange
  Adventure: { from: "#062f4f", via: "#007a87", to: "#f0b44c" }, // Deep teal to gold
  Animation: { from: "#2e0854", via: "#7c3aed", to: "#f472b6" }, // Violet to pink
  Comedy: { from: "#2d1f10", via: "#d97706", to: "#facc15" }, // Brown to amber
  Crime: { from: "#1c1917", via: "#44403c", to: "#78716c" }, // Dark stone/slate
  Documentary: { from: "#0f172a", via: "#334155", to: "#64748b" }, // Slate gray
  Drama: { from: "#1e1b4b", via: "#4338ca", to: "#a5b4fc" }, // Dark indigo to light indigo
  Family: { from: "#14532d", via: "#22c55e", to: "#a3e635" }, // Forest green to lime
  Fantasy: { from: "#311042", via: "#a21caf", to: "#f472b6" }, // Purple to rose
  History: { from: "#2d1610", via: "#7c2d12", to: "#b45309" }, // Dark brown to amber
  Horror: { from: "#180808", via: "#7f1d1d", to: "#3f0a0a" }, // Dark red/black
  Music: { from: "#32120f", via: "#b9472f", to: "#f2b84b" }, // Warm red/yellow (Elvis theme)
  Mystery: { from: "#1e154a", via: "#5b21b6", to: "#ec4899" }, // Indigo to pink
  Romance: { from: "#4c0519", via: "#be123c", to: "#fda4af" }, // Dark rose to light pink
  "Sci-Fi": { from: "#0f1e2b", via: "#1d4ed8", to: "#38bdf8" }, // Midnight blue to sky blue
  "Science Fiction": { from: "#0f1e2b", via: "#1d4ed8", to: "#38bdf8" },
  Thriller: { from: "#111827", via: "#374151", to: "#9ca3af" }, // Dark charcoal
  War: { from: "#1a2421", via: "#4b5320", to: "#8f9779" }, // Olive green
  Western: { from: "#451a03", via: "#7c2d12", to: "#d97706" }, // Warm desert gold
};

function getPosterTheme(genres: string[]): { from: string; via: string; to: string } {
  for (const genre of genres) {
    if (GENRE_GRADIENTS[genre]) {
      return GENRE_GRADIENTS[genre];
    }
  }
  // Default gradient
  return { from: "#0f172a", via: "#1e293b", to: "#475569" };
}

// Convert TMDB genre IDs to strings
const TMDB_GENRES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const TMDB_GENRE_IDS: Record<string, number> = Object.fromEntries(
  Object.entries(TMDB_GENRES).map(([id, genre]) => [genre, Number(id)]),
);
TMDB_GENRE_IDS["Sci-fi"] = 878;

type SessionMovieOptions = {
  excludedMovieIds?: string[];
  limit?: number;
  round?: number;
  seed?: string;
};

function appendWatchProvidersUrl(movieId: number) {
  return `${BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=watch%2Fproviders`;
}

function stableHash(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function genreIdsForNames(genres: string[]) {
  return [...new Set(genres.flatMap((genre) => {
    const genreId = TMDB_GENRE_IDS[genre];
    return genreId ? [genreId] : [];
  }))];
}

function releaseDateFloor(filters: SessionFilters) {
  const currentYear = new Date().getFullYear();

  if (filters.releaseAge === "New/recent") return `${currentYear - 2}-01-01`;
  if (filters.releaseAge === "Last 5 years") return `${currentYear - 5}-01-01`;
  if (filters.releaseAge === "2000s and newer") return "2000-01-01";
  if (filters.releaseAge === "90s and newer") return "1990-01-01";
  return null;
}

function buildDiscoverParams(filters: SessionFilters, page: number) {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY,
    include_adult: "false",
    include_video: "false",
    language: "en-US",
    page: String(page),
    region: "US",
    sort_by: "popularity.desc",
    "vote_count.gte": "50",
  });
  const selectedGenreIds = genreIdsForNames(filters.genres);
  const moodGenreIds = genreIdsForNames(genresForMoods(filters.moods));
  const discoveryGenreIds = selectedGenreIds.length ? selectedGenreIds : moodGenreIds;

  if (discoveryGenreIds.length) {
    params.set("with_genres", discoveryGenreIds.join("|"));
  } else if (filters.animationPreference === "Animation") {
    params.set("with_genres", "16");
  }

  if (filters.animationPreference === "Live action") {
    params.set("without_genres", "16");
  }

  if (filters.runtime === "Under 90 minutes") {
    params.set("with_runtime.lte", "89");
  } else if (filters.runtime === "Under 2 hours") {
    params.set("with_runtime.lte", "120");
  }

  const minimumReleaseDate = releaseDateFloor(filters);
  if (minimumReleaseDate) {
    params.set("primary_release_date.gte", minimumReleaseDate);
  }

  return params;
}

async function fetchDiscoverPage(filters: SessionFilters, page: number) {
  const params = buildDiscoverParams(filters, page);
  const response = await fetch(`${BASE_URL}/discover/movie?${params}`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`TMDB discover failed with ${response.status}`);
  }

  const data = (await response.json()) as TmdbMovieListResponse;
  return data.results ?? [];
}

export async function mapTmdbMovie(tmdbMovie: TmdbMoviePayload): Promise<MediaItem> {
  let movieDetails = tmdbMovie;

  if (!tmdbMovie.runtime || !tmdbMovie["watch/providers"]) {
    try {
      const response = await fetch(appendWatchProvidersUrl(tmdbMovie.id), {
        next: { revalidate: 86400 },
      });

      if (response.ok) {
        movieDetails = { ...tmdbMovie, ...((await response.json()) as TmdbMoviePayload) };
      }
    } catch (error) {
      console.error("Error fetching movie details:", tmdbMovie.id, error);
    }
  }

  const genres = (movieDetails.genre_ids || movieDetails.genres || [])
    .map((genre) => (typeof genre === "object" ? genre.name : TMDB_GENRES[genre]))
    .filter((genre): genre is string => Boolean(genre));

  const poster_url = movieDetails.poster_path
    ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`
    : "/placeholder-poster.png";

  const backdrop_url = movieDetails.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movieDetails.backdrop_path}`
    : "/placeholder-backdrop.png";

  const watch_providers: WatchProvider[] = [];
  const usProviders = movieDetails["watch/providers"]?.results?.US;
  const addProviders = (
    providers: TmdbWatchProvider[] | undefined,
    type: "stream" | "rent" | "buy" | "free" | "ads",
  ) => {
    providers?.forEach((provider) => {
      watch_providers.push({
        id: `wp-${movieDetails.id}-${provider.provider_id}-${type}`,
        media_item_id: `tmdb-${movieDetails.id}`,
        country_code: "US",
        provider_name: provider.provider_name,
        provider_type: type,
        provider_logo_url: provider.logo_path
          ? `https://image.tmdb.org/t/p/w92${provider.logo_path}`
          : undefined,
        last_checked_at: new Date().toISOString(),
      });
    });
  };

  if (usProviders) {
    addProviders(usProviders.flatrate, "stream");
    addProviders(usProviders.rent, "rent");
    addProviders(usProviders.buy, "buy");
    addProviders(usProviders.free, "free");
    addProviders(usProviders.ads, "ads");
  }

  return {
    id: `tmdb-${movieDetails.id}`,
    tmdb_id: movieDetails.id,
    imdb_id: movieDetails.imdb_id || `tt${movieDetails.id}`,
    title: movieDetails.title || "Untitled movie",
    overview: movieDetails.overview || "No overview available.",
    poster_url,
    backdrop_url,
    release_date: movieDetails.release_date || "2000-01-01",
    runtime_minutes: movieDetails.runtime || 120,
    genres,
    tmdb_rating: Number((movieDetails.vote_average || 0).toFixed(1)),
    imdb_rating: Number((movieDetails.vote_average || 0).toFixed(1)), // Fallback to TMDB rating
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    posterTheme: getPosterTheme(genres),
    watch_providers,
  };
}

export async function fetchMoviesForSession(
  filters: SessionFilters,
  options: SessionMovieOptions = {},
): Promise<MediaItem[]> {
  const limit = Math.min(Math.max(options.limit ?? 24, 1), 40);
  const round = Math.max(options.round ?? 0, 0);
  const seed = `${options.seed ?? "vibematch"}:${round}`;
  const firstPage = 1 + (stableHash(seed) % 5);
  const pages = [0, 1, 2].map((offset) => ((firstPage - 1 + offset) % 5) + 1);

  try {
    let discovered = (await Promise.all(
      pages.map((page) => fetchDiscoverPage(filters, page)),
    )).flat();

    if (discovered.length < Math.min(limit, 12) && !pages.includes(1)) {
      discovered = [...discovered, ...(await fetchDiscoverPage(filters, 1))];
    }

    const selectedGenreIds = new Set(genreIdsForNames(filters.genres));
    const excludedMovieIds = new Set(options.excludedMovieIds ?? []);
    const uniqueCandidates = [...new Map(
      discovered
        .filter((movie) => {
          if (excludedMovieIds.has(`tmdb-${movie.id}`)) return false;

          const genres = movie.genre_ids ?? [];
          const genreMatches =
            selectedGenreIds.size === 0 || genres.some((genre) => selectedGenreIds.has(genre));
          const animationMatches =
            filters.animationPreference === "Either" ||
            (filters.animationPreference === "Animation"
              ? genres.includes(16)
              : !genres.includes(16));

          return genreMatches && animationMatches;
        })
        .map((movie) => [movie.id, movie]),
    ).values()];
    const movies = await Promise.all(uniqueCandidates.slice(0, limit).map(mapTmdbMovie));

    await cacheMovies(movies);
    return movies;
  } catch (error) {
    console.error("Error fetching session movies:", error);
    return [];
  }
}

async function cacheMovies(movies: MediaItem[]) {
  if (movies.length === 0) return;
  try {
    const supabase = await createClient();
    const rows = movies.map((movie) => ({
      id: movie.id,
      tmdb_id: movie.tmdb_id,
      imdb_id: movie.imdb_id,
      title: movie.title,
      overview: movie.overview,
      poster_url: movie.poster_url,
      backdrop_url: movie.backdrop_url,
      release_date: movie.release_date,
      runtime_minutes: movie.runtime_minutes,
      genres: movie.genres,
      tmdb_rating: movie.tmdb_rating,
      imdb_rating: movie.imdb_rating,
      poster_theme: movie.posterTheme,
      watch_providers: movie.watch_providers,
      updated_at: new Date().toISOString(),
    }));

    await supabase.from("movies").upsert(rows, { onConflict: "id" });
  } catch (error) {
    console.error("Failed to cache movies in database:", error);
  }
}

export async function fetchTrendingMovies(): Promise<MediaItem[]> {
  try {
    const res = await fetch(`${BASE_URL}/trending/movie/day?api_key=${TMDB_API_KEY}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Failed to fetch trending movies");
    const data = (await res.json()) as TmdbMovieListResponse;
    const moviePromises = (data.results || []).slice(0, 10).map((movie) => mapTmdbMovie(movie));
    const movies = await Promise.all(moviePromises);
    
    // Cache the fetched trending movies asynchronously
    await cacheMovies(movies);

    return movies;
  } catch (error) {
    console.error("Error in fetchTrendingMovies:", error);
    return [];
  }
}

export async function searchMovies(query: string): Promise<MediaItem[]> {
  if (!query) return [];
  try {
    const encodedQuery = encodeURIComponent(query);
    const res = await fetch(
      `${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodedQuery}&include_adult=false&language=en-US`,
      { next: { revalidate: 600 } }
    );
    if (!res.ok) throw new Error("Failed to search movies");
    const data = (await res.json()) as TmdbMovieListResponse;
    const moviePromises = (data.results || []).slice(0, 8).map((movie) => mapTmdbMovie(movie));
    const movies = await Promise.all(moviePromises);
    
    // Cache the search result movies asynchronously
    await cacheMovies(movies);

    return movies;
  } catch (error) {
    console.error("Error in searchMovies:", error);
    return [];
  }
}

export async function fetchMovieById(movieId: string): Promise<MediaItem | null> {
  const tmdbId = movieId.startsWith("tmdb-") ? movieId.replace("tmdb-", "") : movieId;

  if (!/^\d+$/.test(tmdbId)) return null;

  try {
    // 1. Check database cache first
    const supabase = await createClient();
    const { data: cachedMovie, error: dbError } = await supabase
      .from("movies")
      .select("*")
      .eq("id", `tmdb-${tmdbId}`)
      .maybeSingle();

    if (cachedMovie && !dbError) {
      return {
        id: cachedMovie.id,
        tmdb_id: cachedMovie.tmdb_id,
        imdb_id: cachedMovie.imdb_id || `tt${tmdbId}`,
        title: cachedMovie.title,
        overview: cachedMovie.overview || "",
        poster_url: cachedMovie.poster_url || "",
        backdrop_url: cachedMovie.backdrop_url || "",
        release_date: cachedMovie.release_date || "2000-01-01",
        runtime_minutes: cachedMovie.runtime_minutes || 120,
        genres: cachedMovie.genres || [],
        tmdb_rating: Number(cachedMovie.tmdb_rating || 0),
        imdb_rating: Number(cachedMovie.imdb_rating || 0),
        created_at: cachedMovie.created_at,
        updated_at: cachedMovie.updated_at,
        posterTheme: cachedMovie.poster_theme as MediaItem["posterTheme"],
        watch_providers: (cachedMovie.watch_providers as WatchProvider[]) || [],
      };
    }

    // 2. Fetch from TMDB if not in cache
    const res = await fetch(appendWatchProvidersUrl(Number(tmdbId)), {
      next: { revalidate: 86400 },
    });

    if (!res.ok) throw new Error("Failed to fetch movie details");

    const data = (await res.json()) as TmdbMoviePayload;
    const movie = await mapTmdbMovie(data);

    // 3. Cache the newly fetched movie
    if (movie) {
      await cacheMovies([movie]);
    }

    return movie;
  } catch (error) {
    console.error("Error fetching movie by id:", movieId, error);
    return null;
  }
}
