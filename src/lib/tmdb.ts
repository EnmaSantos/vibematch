import { MediaItem, WatchProvider } from "./vibematch-data";

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

export async function mapTmdbMovie(tmdbMovie: TmdbMoviePayload): Promise<MediaItem> {
  const genres = (tmdbMovie.genre_ids || tmdbMovie.genres || [])
    .map((genre) => (typeof genre === "object" ? genre.name : TMDB_GENRES[genre]))
    .filter((genre): genre is string => Boolean(genre));

  const poster_url = tmdbMovie.poster_path
    ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`
    : "/placeholder-poster.png";

  const backdrop_url = tmdbMovie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${tmdbMovie.backdrop_path}`
    : "/placeholder-backdrop.png";

  // Get watch providers for the US
  const watch_providers: WatchProvider[] = [];
  try {
    const res = await fetch(
      `${BASE_URL}/movie/${tmdbMovie.id}/watch/providers?api_key=${TMDB_API_KEY}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );
    if (res.ok) {
      const data = (await res.json()) as TmdbWatchProviderResponse;
      const usProviders = data.results?.US;
      if (usProviders) {
        const fetchProviders = (list: TmdbWatchProvider[] | undefined, type: "stream" | "rent" | "buy" | "free" | "ads") => {
          if (!list) return;
          list.forEach((p) => {
            watch_providers.push({
              id: `wp-${tmdbMovie.id}-${p.provider_id}-${type}`,
              media_item_id: `tmdb-${tmdbMovie.id}`,
              country_code: "US",
              provider_name: p.provider_name,
              provider_type: type,
              provider_logo_url: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : undefined,
              last_checked_at: new Date().toISOString(),
            });
          });
        };

        fetchProviders(usProviders.flatrate, "stream");
        fetchProviders(usProviders.rent, "rent");
        fetchProviders(usProviders.buy, "buy");
        fetchProviders(usProviders.free, "free");
        fetchProviders(usProviders.ads, "ads");
      }
    }
  } catch (error) {
    console.error("Error fetching watch providers for movie:", tmdbMovie.id, error);
  }

  // Get details (like runtime) if not present
  let runtime = tmdbMovie.runtime || 120;
  let imdb_id = tmdbMovie.imdb_id || `tt${tmdbMovie.id}`;
  if (!tmdbMovie.runtime) {
    try {
      const res = await fetch(`${BASE_URL}/movie/${tmdbMovie.id}?api_key=${TMDB_API_KEY}`, {
        next: { revalidate: 86400 }, // Cache for 24 hours
      });
      if (res.ok) {
        const details = await res.json();
        runtime = details.runtime || runtime;
        imdb_id = details.imdb_id || imdb_id;
      }
    } catch (e) {
      console.error(e);
    }
  }

  return {
    id: `tmdb-${tmdbMovie.id}`,
    tmdb_id: tmdbMovie.id,
    imdb_id,
    title: tmdbMovie.title || "Untitled movie",
    overview: tmdbMovie.overview || "No overview available.",
    poster_url,
    backdrop_url,
    release_date: tmdbMovie.release_date || "2000-01-01",
    runtime_minutes: runtime,
    genres,
    tmdb_rating: Number((tmdbMovie.vote_average || 0).toFixed(1)),
    imdb_rating: Number((tmdbMovie.vote_average || 0).toFixed(1)), // Fallback to TMDB rating
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    posterTheme: getPosterTheme(genres),
    watch_providers,
  };
}

export async function fetchTrendingMovies(): Promise<MediaItem[]> {
  try {
    const res = await fetch(`${BASE_URL}/trending/movie/day?api_key=${TMDB_API_KEY}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Failed to fetch trending movies");
    const data = (await res.json()) as TmdbMovieListResponse;
    const moviePromises = (data.results || []).slice(0, 10).map((movie) => mapTmdbMovie(movie));
    return await Promise.all(moviePromises);
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
    return await Promise.all(moviePromises);
  } catch (error) {
    console.error("Error in searchMovies:", error);
    return [];
  }
}

export async function fetchMovieById(movieId: string): Promise<MediaItem | null> {
  const tmdbId = movieId.startsWith("tmdb-") ? movieId.replace("tmdb-", "") : movieId;

  if (!/^\d+$/.test(tmdbId)) return null;

  try {
    const res = await fetch(`${BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`, {
      next: { revalidate: 86400 },
    });

    if (!res.ok) throw new Error("Failed to fetch movie details");

    const data = (await res.json()) as TmdbMoviePayload;
    return await mapTmdbMovie(data);
  } catch (error) {
    console.error("Error fetching movie by id:", movieId, error);
    return null;
  }
}
