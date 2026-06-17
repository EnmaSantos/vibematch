"use client";

import { useState, useRef, useEffect } from "react";
import { Heart, Sparkles, RefreshCw, Star, Info, Search } from "lucide-react";
import { animate, set } from "animejs";
import { MediaItem } from "@/lib/vibematch-data";
import { recordSwipe } from "@/app/app/swipe/actions";
import MovieDetailsModal from "./MovieDetailsModal";

interface SwipeDeckProps {
  movies: MediaItem[];
  sessionId: string;
}

type SwipeIntent = "like" | "skip";

type SwipeDecision = {
  movie: MediaItem;
  intent: SwipeIntent;
};

function resetCardElement(card: HTMLDivElement, opacity = 1) {
  set(card, {
    translateX: 0,
    rotate: 0,
    scale: 1,
    opacity,
  });
}

function releaseYear(movie: MediaItem) {
  return movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A";
}

export default function SwipeDeck({ movies: initialMovies, sessionId }: SwipeDeckProps) {
  const movies = initialMovies;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedMovie, setSelectedMovie] = useState<MediaItem | null>(null);
  const [swipeDecisions, setSwipeDecisions] = useState<SwipeDecision[]>([]);
  const [animating, setAnimating] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const likeBtnRef = useRef<HTMLButtonElement>(null);
  const skipBtnRef = useRef<HTMLButtonElement>(null);

  const currentMovie = movies[currentIndex];

  const handleSwipe = async (intent: SwipeIntent) => {
    if (animating || !currentMovie) return;
    setAnimating(true);
    const swipedMovie = currentMovie;
    const isLike = intent === "like";

    try {
      // Highlight button animation with glow
      if (isLike && likeBtnRef.current) {
        animate(likeBtnRef.current, {
          scale: [1, 1.08, 1],
          boxShadow: [
            "0 0 0 0 rgba(45, 212, 167, 0)",
            "0 0 24px 8px rgba(45, 212, 167, 0.6)",
            "0 0 0 0 rgba(45, 212, 167, 0)"
          ],
          duration: 400,
          ease: "outQuad",
        });
      } else if (!isLike && skipBtnRef.current) {
        animate(skipBtnRef.current, {
          scale: [1, 1.08, 1],
          boxShadow: [
            "0 0 0 0 rgba(244, 63, 94, 0)",
            "0 0 24px 8px rgba(244, 63, 94, 0.6)",
            "0 0 0 0 rgba(244, 63, 94, 0)"
          ],
          duration: 400,
          ease: "outQuad",
        });
      }

      // Swipe card animation (softer translation/rotation)
      if (cardRef.current) {
        await animate(cardRef.current, {
          translateX: [0, isLike ? 250 : -250],
          rotate: [0, isLike ? 8 : -8],
          opacity: [1, 0],
          duration: 600,
          ease: "outQuad",
        }).then;

        resetCardElement(cardRef.current, 0);
      }

      // Record swipe in database
      try {
        await recordSwipe(sessionId, swipedMovie.id, intent);
      } catch (err) {
        console.error("Failed to record swipe:", err);
      }

      setSwipeDecisions((prev) => [
        ...prev.filter((decision) => decision.movie.id !== swipedMovie.id),
        { movie: swipedMovie, intent },
      ]);

      // Move to next movie
      setCurrentIndex((prev) => prev + 1);
    } finally {
      setAnimating(false);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSwipeDecisions([]);
    setAnimating(false);
    // Reset cards animation
    if (cardRef.current) {
      resetCardElement(cardRef.current);
    }
  };

  // Initial card entry animation
  useEffect(() => {
    const card = cardRef.current;
    if (card && currentMovie) {
      set(card, {
        translateX: 0,
        rotate: 0,
        scale: 0.95,
        opacity: 0,
      });

      const entryAnimation = animate(card, {
        opacity: [0, 1],
        scale: [0.95, 1],
        duration: 500,
        ease: "outBack",
      });

      return () => entryAnimation.cancel();
    }
  }, [currentMovie]);

  if (currentIndex >= movies.length || !currentMovie) {
    const likedMovies = swipeDecisions
      .filter((decision) => decision.intent === "like")
      .map((decision) => decision.movie);
    const skippedCount = swipeDecisions.filter(
      (decision) => decision.intent === "skip",
    ).length;
    const hasMatches = likedMovies.length > 0;

    return (
      <>
        <div className="mx-auto w-full max-w-[440px] rounded-[32px] border border-white/14 bg-[#080a12] p-4 shadow-2xl shadow-black/40">
          <div className="rounded-[24px] border border-white/10 bg-[#0c111a] p-5">
            <div className="flex items-start gap-4">
              <div
                className={`flex size-14 shrink-0 items-center justify-center rounded-lg border ${
                  hasMatches
                    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-300"
                    : "border-[#f0b44c]/25 bg-[#f0b44c]/10 text-[#f0b44c]"
                }`}
              >
                {hasMatches ? (
                  <Heart className="size-7 fill-current" />
                ) : (
                  <Sparkles className="size-7" />
                )}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-bold uppercase text-[#f0b44c]">
                  Session results
                </p>
                <h3 className="mt-1 text-2xl font-black leading-tight text-white">
                  {hasMatches
                    ? `${likedMovies.length} ${likedMovies.length === 1 ? "match" : "matches"} saved`
                    : "No matches this round"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#aeb7c7]">
                  {hasMatches
                    ? "These are the titles you said yes to before the deck ended."
                    : "No liked titles were saved before the deck ended."}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 text-left">
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-xl font-black text-[#fff8ee]">
                  {likedMovies.length}
                </p>
                <p className="text-[11px] font-bold text-[#8793a6]">liked</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-xl font-black text-[#fff8ee]">{skippedCount}</p>
                <p className="text-[11px] font-bold text-[#8793a6]">skipped</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-xl font-black text-[#fff8ee]">
                  {swipeDecisions.length}
                </p>
                <p className="text-[11px] font-bold text-[#8793a6]">seen</p>
              </div>
            </div>

            {hasMatches ? (
              <div className="mt-5 space-y-2">
                {likedMovies.map((movie) => {
                  const providers = movie.watch_providers
                    ?.filter(
                      (provider, index, self) =>
                        self.findIndex(
                          (item) => item.provider_name === provider.provider_name,
                        ) === index,
                    )
                    .slice(0, 2);

                  return (
                    <button
                      key={movie.id}
                      onClick={() => setSelectedMovie(movie)}
                      className="flex w-full items-center gap-3 rounded-lg border border-emerald-300/15 bg-emerald-300/8 p-3 text-left transition hover:border-emerald-300/30 hover:bg-emerald-300/12"
                    >
                      <span
                        className="flex size-14 shrink-0 items-end overflow-hidden rounded-lg border border-white/10 p-2"
                        style={{
                          background: `linear-gradient(145deg, ${movie.posterTheme?.from || "#0f172a"}, ${movie.posterTheme?.via || "#1e293b"}, ${movie.posterTheme?.to || "#475569"})`,
                        }}
                      >
                        <Heart className="size-4 fill-emerald-200 text-emerald-200" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black text-[#fff8ee]">
                          {movie.title}
                        </span>
                        <span className="mt-1 block text-[11px] font-bold text-[#f0b44c]">
                          {releaseYear(movie)} | {movie.runtime_minutes}m | TMDB{" "}
                          {movie.tmdb_rating}
                        </span>
                        {providers?.length ? (
                          <span className="mt-2 flex flex-wrap gap-1">
                            {providers.map((provider) => (
                              <span
                                key={provider.id}
                                className="inline-flex h-5 items-center rounded border border-white/10 bg-black/20 px-1.5 text-[10px] font-bold text-emerald-100"
                              >
                                {provider.provider_name}
                              </span>
                            ))}
                          </span>
                        ) : null}
                      </span>
                      <Info className="size-4 shrink-0 text-[#8f9bad]" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-dashed border-white/14 bg-white/5 p-4 text-left">
                <p className="text-sm font-black text-[#fff8ee]">
                  Try another pass with a wider vibe.
                </p>
                <p className="mt-2 text-sm leading-6 text-[#aeb7c7]">
                  A broader search gives the next session more chances to land on
                  something worth watching.
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleReset}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-[#f0b44c] px-5 text-sm font-bold text-[#18100b] transition hover:bg-[#ffd06f]"
              >
                <RefreshCw className="size-4" /> Swipe Again
              </button>
              <a
                href="/app/search"
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/5 px-5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                <Search className="size-4" /> Find More
              </a>
            </div>
          </div>
        </div>

        {selectedMovie ? (
          <MovieDetailsModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
        ) : null}
      </>
    );
  }

  const hasRealPoster = currentMovie.poster_url && !currentMovie.poster_url.includes("placeholder");
  const currentReleaseYear = releaseYear(currentMovie);

  return (
    <>
      <div className="mx-auto w-full max-w-[390px] rounded-[32px] border border-white/14 bg-[#080a12] p-3 shadow-2xl shadow-black/40 relative overflow-hidden">
        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0c111a] relative min-h-[500px]">
          {/* Card stack container */}
          <div
            key={currentMovie.id}
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
                  {currentReleaseYear} | {currentMovie.genres.join(", ")}
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
                    {currentReleaseYear} | {currentMovie.runtime_minutes}m | {currentMovie.genres.join(", ")}
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
