"use client";

import { useEffect, useRef, useState } from "react";
import { X, Calendar, Clock, Film, Star, Loader2, Sparkles } from "lucide-react";
import { animate } from "animejs";
import { MediaItem } from "@/lib/vibematch-data";
import { getMovieRatings } from "@/app/actions/movie";
import { type OmdbRatings } from "@/lib/omdb";

interface MovieDetailsModalProps {
  movie: MediaItem;
  onClose: () => void;
}

export default function MovieDetailsModal({ movie, onClose }: MovieDetailsModalProps) {
  const [ratings, setRatings] = useState<OmdbRatings | null>(null);
  const [loadingRatings, setLoadingRatings] = useState(true);
  
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load ratings from OMDB
    async function loadRatings() {
      if (movie.imdb_id) {
        try {
          const fetched = await getMovieRatings(movie.imdb_id);
          setRatings(fetched);
        } catch (err) {
          console.error("Failed to load movie ratings:", err);
        }
      }
      setLoadingRatings(false);
    }
    loadRatings();

    // Trigger modal enter animation
    if (backdropRef.current && contentRef.current) {
      animate(backdropRef.current, {
        opacity: [0, 1],
        duration: 300,
        ease: "outQuad",
      });

      animate(contentRef.current, {
        opacity: [0, 1],
        scale: [0.92, 1],
        translateY: [20, 0],
        duration: 400,
        ease: "outBack",
      });
    }

    // Disable background scrolling
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [movie]);

  const handleClose = () => {
    if (backdropRef.current && contentRef.current) {
      animate(backdropRef.current, {
        opacity: [1, 0],
        duration: 250,
        ease: "outQuad",
      });

      animate(contentRef.current, {
        opacity: [1, 0],
        scale: [1, 0.95],
        translateY: [0, 15],
        duration: 250,
        ease: "outQuad",
      }).then(onClose);
    } else {
      onClose();
    }
  };

  const hasRealPoster = movie.poster_url && !movie.poster_url.includes("placeholder");
  const hasRealBackdrop = movie.backdrop_url && !movie.backdrop_url.includes("placeholder");
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A";

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 md:p-6 opacity-0 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        ref={contentRef}
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/12 bg-[#0c111a] shadow-2xl opacity-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Backdrop Image banner */}
        <div className="relative h-48 w-full bg-slate-900 md:h-64">
          {hasRealBackdrop ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={movie.backdrop_url}
              alt={movie.title}
              className="h-full w-full object-cover opacity-40"
            />
          ) : (
            <div
              className="h-full w-full opacity-35"
              style={{
                background: `linear-gradient(135deg, ${movie.posterTheme?.from || "#0f172a"}, ${movie.posterTheme?.via || "#1e293b"}, ${movie.posterTheme?.to || "#475569"})`,
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c111a] to-transparent" />
          
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-black/60 border border-white/10 text-white hover:bg-black/80 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content detail layout */}
        <div className="px-5 pb-6 pt-2 sm:px-8 sm:pb-8 flex flex-col md:flex-row gap-6">
          {/* Floating Poster on desktop */}
          <div className="relative -mt-24 w-32 shrink-0 overflow-hidden rounded-lg border border-white/15 shadow-xl bg-black/40 aspect-[2/3] hidden md:block">
            {hasRealPoster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={movie.poster_url} alt={movie.title} className="h-full w-full object-cover" />
            ) : (
              <div
                className="h-full w-full flex flex-col justify-end p-2"
                style={{
                  background: `linear-gradient(135deg, ${movie.posterTheme?.from || "#0f172a"}, ${movie.posterTheme?.via || "#1e293b"}, ${movie.posterTheme?.to || "#475569"})`,
                }}
              >
                <Film className="size-6 text-white/30" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header info */}
            <div>
              <span className="inline-flex items-center gap-1 rounded bg-[#f0b44c]/10 border border-[#f0b44c]/20 px-2 py-0.5 text-xs font-bold text-[#ffd98a] mb-2">
                <Sparkles className="size-3" />
                VibeMatch Choice
              </span>
              <h2 className="text-2xl font-black text-white sm:text-3xl leading-tight">
                {movie.title}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#8f9bad] font-bold">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  {releaseYear}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {movie.runtime_minutes} minutes
                </span>
                <span className="flex items-center gap-1">
                  <Star className="size-3.5 text-[#f0b44c] fill-[#f0b44c]" />
                  TMDB {movie.tmdb_rating}
                </span>
              </div>
            </div>

            {/* Movie Ratings Section (IMDb & Rotten Tomatoes) */}
            <div className="mt-4 border-y border-white/8 py-3">
              <h4 className="text-[10px] font-bold uppercase text-[#687386] mb-2">Aggregated Ratings</h4>
              {loadingRatings ? (
                <div className="flex items-center gap-1.5 text-xs text-[#8f9bad]">
                  <Loader2 className="size-3.5 animate-spin text-[#f0b44c]" />
                  Fetching live scores from OMDB...
                </div>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {/* IMDb rating display */}
                  {ratings?.imdbRating ? (
                    <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5">
                      <span className="inline-flex items-center rounded bg-[#f0b44c] px-2 py-0.5 text-[10px] font-black text-black">
                        IMDb
                      </span>
                      <span className="text-sm font-black text-[#fff8ee]">
                        {ratings.imdbRating}
                      </span>
                    </div>
                  ) : null}

                  {/* Rotten Tomatoes rating display */}
                  {ratings?.rottenTomatoesRating ? (
                    <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5">
                      <span className="inline-flex items-center rounded bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white">
                        🍅 Rotten Tomatoes
                      </span>
                      <span className="text-sm font-black text-[#fff8ee]">
                        {ratings.rottenTomatoesRating}
                      </span>
                    </div>
                  ) : null}

                  {/* Metacritic rating display */}
                  {ratings?.metacriticRating ? (
                    <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5">
                      <span className="inline-flex items-center rounded bg-blue-600 px-2 py-0.5 text-[10px] font-black text-white">
                        Metacritic
                      </span>
                      <span className="text-sm font-black text-[#fff8ee]">
                        {ratings.metacriticRating}
                      </span>
                    </div>
                  ) : null}

                  {!ratings?.imdbRating && !ratings?.rottenTomatoesRating && !ratings?.metacriticRating && (
                    <span className="text-xs text-[#687386]">No third-party ratings found.</span>
                  )}
                </div>
              )}
            </div>

            {/* Crew Details if available */}
            {!loadingRatings && ratings && (ratings.director || ratings.actors) ? (
              <div className="mt-3 text-xs space-y-1">
                {ratings.director ? (
                  <p className="text-[#aeb7c7]">
                    <strong className="text-white">Director:</strong> {ratings.director}
                  </p>
                ) : null}
                {ratings.actors ? (
                  <p className="text-[#aeb7c7]">
                    <strong className="text-white">Cast:</strong> {ratings.actors}
                  </p>
                ) : null}
              </div>
            ) : null}

            {/* Overview */}
            <div className="mt-4">
              <h4 className="text-[10px] font-bold uppercase text-[#687386] mb-1">Overview</h4>
              <p className="text-sm leading-relaxed text-[#c5cedc]">
                {movie.overview}
              </p>
            </div>

            {/* Watch availability */}
            <div className="mt-5">
              <h4 className="text-[10px] font-bold uppercase text-[#687386] mb-2">Available Watch Providers (US)</h4>
              {movie.watch_providers && movie.watch_providers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {movie.watch_providers
                    .filter((p, index, self) => self.findIndex(t => t.provider_name === p.provider_name) === index)
                    .map((provider) => (
                      <span
                        key={provider.id}
                        className="inline-flex h-7 items-center rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2.5 text-xs font-bold text-emerald-300"
                      >
                        {provider.provider_name}
                      </span>
                    ))}
                </div>
              ) : (
                <p className="text-xs text-[#687386]">Check your local streaming services for current options.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
