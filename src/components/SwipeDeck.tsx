"use client";

import { useState, useRef, useEffect } from "react";
import { Timer, Heart, Sparkles, RefreshCw, Star, Info, Play } from "lucide-react";
import { animate } from "animejs";
import { MediaItem } from "@/lib/vibematch-data";
import { recordSwipe } from "@/app/app/swipe/actions";
import MovieDetailsModal from "./MovieDetailsModal";

interface SwipeDeckProps {
  movies: MediaItem[];
  sessionId: string;
}

export default function SwipeDeck({ movies: initialMovies, sessionId }: SwipeDeckProps) {
  const [movies, setMovies] = useState<MediaItem[]>(initialMovies);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedMovie, setSelectedMovie] = useState<MediaItem | null>(null);
  const [animating, setAnimating] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const likeBtnRef = useRef<HTMLButtonElement>(null);
  const skipBtnRef = useRef<HTMLButtonElement>(null);

  const currentMovie = movies[currentIndex];

  const handleSwipe = async (intent: "like" | "skip") => {
    if (animating || !currentMovie) return;
    setAnimating(true);

    const isLike = intent === "like";
    
    // Highlight button animation
    if (isLike && likeBtnRef.current) {
      animate(likeBtnRef.current, {
        scale: [1, 1.15, 1],
        duration: 300,
        ease: "outQuad",
      });
    } else if (!isLike && skipBtnRef.current) {
      animate(skipBtnRef.current, {
        scale: [1, 1.15, 1],
        duration: 300,
        ease: "outQuad",
      });
    }

    // Swipe card animation
    if (cardRef.current) {
      await animate(cardRef.current, {
        translateX: [0, isLike ? 450 : -450],
        rotate: [0, isLike ? 15 : -15],
        opacity: [1, 0],
        duration: 500,
        ease: "inOutQuad",
      }).then;
    }

    // Record swipe in database
    try {
      await recordSwipe(sessionId, currentMovie.id, intent);
    } catch (err) {
      console.error("Failed to record swipe:", err);
    }

    // Move to next movie
    setCurrentIndex((prev) => prev + 1);

    // Reset card pos for next card
    if (cardRef.current) {
      cardRef.current.style.transform = "translateX(0px) rotate(0deg)";
      cardRef.current.style.opacity = "0";
    }

    // Fade in new card
    if (currentIndex + 1 < movies.length && cardRef.current) {
      animate(cardRef.current, {
        scale: [0.9, 1],
        opacity: [0, 1],
        duration: 350,
        ease: "outQuad",
      });
    }

    setAnimating(false);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    // Reset cards animation
    if (cardRef.current) {
      cardRef.current.style.transform = "translateX(0px) rotate(0deg)";
      cardRef.current.style.opacity = "1";
    }
  };

  // Initial card entry animation
  useEffect(() => {
    if (cardRef.current && currentMovie) {
      animate(cardRef.current, {
        opacity: [0, 1],
        scale: [0.95, 1],
        duration: 500,
        ease: "outBack",
      });
    }
  }, [currentMovie]);

  if (currentIndex >= movies.length || !currentMovie) {
    return (
      <div className="mx-auto w-full max-w-[390px] rounded-[32px] border border-white/14 bg-[#080a12] p-6 text-center shadow-2xl">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="flex size-16 items-center justify-center rounded-full bg-[#f0b44c]/10 text-[#f0b44c] mb-6">
            <Sparkles className="size-8" />
          </div>
          <h3 className="text-2xl font-black text-white">Deck Complete!</h3>
          <p className="mt-3 text-sm text-[#aeb7c7] leading-relaxed max-w-[250px]">
            You've swiped through all trending movies for now.
          </p>
          <div className="mt-8 flex flex-col gap-3 w-full">
            <button
              onClick={handleReset}
              className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[#f0b44c] px-5 text-sm font-bold text-[#18100b] hover:bg-[#ffd06f] transition"
            >
              <RefreshCw className="size-4" /> Swipe Again
            </button>
            <a
              href="/app/search"
              className="flex h-12 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/5 text-sm font-bold text-white hover:bg-white/10 transition"
            >
              Find More Movies
            </a>
          </div>
        </div>
      </div>
    );
  }

  const hasRealPoster = currentMovie.poster_url && !currentMovie.poster_url.includes("placeholder");
  const releaseYear = currentMovie.release_date ? new Date(currentMovie.release_date).getFullYear() : "N/A";

  return (
    <>
      <div className="mx-auto w-full max-w-[390px] rounded-[32px] border border-white/14 bg-[#080a12] p-3 shadow-2xl shadow-black/40 relative overflow-hidden">
        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0c111a] relative min-h-[500px]">
          {/* Card stack container */}
          <div
            ref={cardRef}
            className="px-4 pb-4 pt-3 flex flex-col justify-between h-full min-h-[480px] opacity-0"
          >
            {/* Interactive Poster Area */}
            <div
              onClick={() => setSelectedMovie(currentMovie)}
              className="relative overflow-hidden rounded-lg border border-white/15 shadow-xl shadow-black/35 aspect-[3/4] cursor-pointer group"
              style={{
                background: `linear-gradient(145deg, ${currentMovie.posterTheme?.from || "#0f172a"}, ${currentMovie.posterTheme?.via || "#1e293b"}, ${currentMovie.posterTheme?.to || "#475569"})`,
              }}
            >
              {hasRealPoster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentMovie.poster_url}
                  alt={currentMovie.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
                />
              ) : (
                <div className="absolute inset-x-5 top-6 h-4 rounded-full bg-white/20" />
              )}
              
              {/* TMDB rating score */}
              <div className="absolute left-3 top-3 flex items-center gap-1 rounded-md bg-black/75 px-2.5 py-1 text-xs font-bold text-[#f0b44c] border border-white/5">
                <Star className="size-3 fill-[#f0b44c] text-[#f0b44c]" />
                {currentMovie.tmdb_rating}
              </div>

              {/* Hover detail trigger hint */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                <span className="flex items-center gap-1.5 rounded-lg bg-black/70 border border-white/15 px-3 py-1.5 text-xs font-bold text-[#fff8ee]">
                  <Info className="size-3.5 text-[#f0b44c]" /> Click to see ratings & info
                </span>
              </div>
              
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-5">
                <p className="font-black leading-tight text-white text-2xl">
                  {currentMovie.title}
                </p>
                <p className="mt-1 text-xs font-bold text-white/75">
                  {releaseYear} | {currentMovie.genres.join(", ")}
                </p>
              </div>
            </div>

            {/* Controls and metadata below card */}
            <div className="space-y-3 pt-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h4 className="text-lg font-black leading-tight text-[#fff8ee] truncate">
                    {currentMovie.title}
                  </h4>
                  <p className="text-[11px] font-bold text-[#f0b44c]">
                    {releaseYear} | {currentMovie.runtime_minutes}m | {currentMovie.genres.join(", ")}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1.5">
                {currentMovie.watch_providers && currentMovie.watch_providers.length > 0 ? (
                  currentMovie.watch_providers.slice(0, 3).map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex h-6 items-center rounded-md border border-emerald-300/15 bg-emerald-300/8 px-2 text-[10px] font-bold text-emerald-100"
                    >
                      {p.provider_name}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-[#687386] font-bold">Stream data not available</span>
                )}
              </div>

              {/* Action Buttons skip/like */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  ref={skipBtnRef}
                  disabled={animating}
                  onClick={() => handleSwipe("skip")}
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-rose-200/15 bg-rose-300/10 text-xs font-bold text-rose-100 hover:bg-rose-300/20 active:scale-95 transition-all duration-150"
                >
                  Skip
                </button>
                <button
                  ref={likeBtnRef}
                  disabled={animating}
                  onClick={() => handleSwipe("like")}
                  className="inline-flex h-12 items-center justify-center gap-1.5 rounded-lg border border-emerald-200/15 bg-[#2dd4a7] text-xs font-bold text-[#061b16] hover:bg-[#4ade80] active:scale-95 transition-all duration-150"
                >
                  <Heart className="size-3.5 fill-[#061b16]" />
                  Like
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Render detailed movie modal if clicked */}
      {selectedMovie ? (
        <MovieDetailsModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
      ) : null}
    </>
  );
}
