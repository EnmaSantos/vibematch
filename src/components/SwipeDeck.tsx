"use client";

import { useState, useRef, useEffect, type PointerEvent } from "react";
import { Bell, Heart, Sparkles, RefreshCw, Star, Info, Search, Timer } from "lucide-react";
import { animate, set } from "animejs";
import { MediaItem } from "@/lib/vibematch-data";
import { recordSwipe } from "@/app/app/swipe/actions";
import MovieDetailsModal from "./MovieDetailsModal";

interface SwipeDeckProps {
  movies: MediaItem[];
  sessionId: string;
  sessionCode?: string;
  sessionDurationSeconds: number;
}

type SwipeIntent = "like" | "skip";

type SwipeDecision = {
  movie: MediaItem;
  intent: SwipeIntent;
};

type SwipeStart = {
  x: number;
  y: number;
  rotate: number;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  hasDragged: boolean;
};

const DRAG_START_DISTANCE = 8;
const SWIPE_TRIGGER_DISTANCE = 110;
const SWIPE_EXIT_DISTANCE = 320;
const DRAG_ROTATION_FACTOR = 0.04;
const MAX_DRAG_ROTATION = 12;
const SESSION_REMINDER_SECONDS = 30;
const DEFAULT_SESSION_DURATION_SECONDS = 180;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function dragRotation(deltaX: number) {
  return clamp(deltaX * DRAG_ROTATION_FACTOR, -MAX_DRAG_ROTATION, MAX_DRAG_ROTATION);
}

function dragTranslateY(deltaY: number) {
  return clamp(deltaY * 0.18, -28, 28);
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element
    ? Boolean(target.closest("a, button, input, select, textarea"))
    : false;
}

function resetCardElement(card: HTMLDivElement, opacity = 1) {
  set(card, {
    translateX: 0,
    translateY: 0,
    rotate: 0,
    scale: 1,
    opacity,
  });
}

function releaseYear(movie: MediaItem) {
  return movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A";
}

function formatSessionTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export default function SwipeDeck({
  movies: initialMovies,
  sessionId,
  sessionCode,
  sessionDurationSeconds,
}: SwipeDeckProps) {
  const movies = initialMovies;
  const sessionSeconds = Math.max(sessionDurationSeconds || DEFAULT_SESSION_DURATION_SECONDS, 1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedMovie, setSelectedMovie] = useState<MediaItem | null>(null);
  const [swipeDecisions, setSwipeDecisions] = useState<SwipeDecision[]>([]);
  const [animating, setAnimating] = useState(false);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(sessionSeconds);

  const cardRef = useRef<HTMLDivElement>(null);
  const likeBtnRef = useRef<HTMLButtonElement>(null);
  const skipBtnRef = useRef<HTMLButtonElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const suppressPosterClickRef = useRef(false);

  const currentMovie = movies[currentIndex];
  const isSessionExpired = timeRemainingSeconds <= 0;

  const handleSwipe = async (
    intent: SwipeIntent,
    swipeStart: SwipeStart = { x: 0, y: 0, rotate: 0 },
  ) => {
    if (animating || isSessionExpired || !currentMovie) return;
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
          translateX: [swipeStart.x, isLike ? SWIPE_EXIT_DISTANCE : -SWIPE_EXIT_DISTANCE],
          translateY: [swipeStart.y, swipeStart.y * 0.6],
          rotate: [swipeStart.rotate, isLike ? 12 : -12],
          opacity: [1, 0],
          duration: 600,
          ease: "outQuad",
        }).then;

        resetCardElement(cardRef.current, 0);
      }

      // Record swipe in database
      try {
        await recordSwipe(sessionId, swipedMovie.id, intent, swipedMovie.genres);
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

  const releasePointer = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const clearClickSuppression = () => {
    window.setTimeout(() => {
      suppressPosterClickRef.current = false;
    }, 0);
  };

  const settleCard = (start: SwipeStart) => {
    if (!cardRef.current) return;

    animate(cardRef.current, {
      translateX: [start.x, 0],
      translateY: [start.y, 0],
      rotate: [start.rotate, 0],
      duration: 260,
      ease: "outQuad",
    });
  };

  const handleCardPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (animating || isSessionExpired || !currentMovie || isInteractiveTarget(event.target)) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      deltaX: 0,
      deltaY: 0,
      hasDragged: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleCardPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId || !cardRef.current) return;

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (!dragState.hasDragged) {
      if (Math.max(absX, absY) < DRAG_START_DISTANCE) return;
      if (absY > absX) {
        dragStateRef.current = null;
        releasePointer(event);
        return;
      }

      dragState.hasDragged = true;
      suppressPosterClickRef.current = true;
    }

    dragState.deltaX = deltaX;
    dragState.deltaY = deltaY;

    set(cardRef.current, {
      translateX: deltaX,
      translateY: dragTranslateY(deltaY),
      rotate: dragRotation(deltaX),
      scale: 1,
      opacity: 1,
    });
  };

  const finishCardPointerGesture = (event: PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    dragStateRef.current = null;
    releasePointer(event);

    if (!dragState.hasDragged) return;

    const start = {
      x: dragState.deltaX,
      y: dragTranslateY(dragState.deltaY),
      rotate: dragRotation(dragState.deltaX),
    };

    if (Math.abs(dragState.deltaX) >= SWIPE_TRIGGER_DISTANCE) {
      void handleSwipe(dragState.deltaX > 0 ? "like" : "skip", start);
    } else {
      settleCard(start);
    }

    clearClickSuppression();
  };

  const cancelCardPointerGesture = (event: PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    dragStateRef.current = null;
    releasePointer(event);

    if (dragState.hasDragged) {
      settleCard({
        x: dragState.deltaX,
        y: dragTranslateY(dragState.deltaY),
        rotate: dragRotation(dragState.deltaX),
      });
      clearClickSuppression();
    }
  };

  const handlePosterClick = () => {
    if (!currentMovie || suppressPosterClickRef.current) return;
    setSelectedMovie(currentMovie);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSwipeDecisions([]);
    setAnimating(false);
    setTimeRemainingSeconds(sessionSeconds);
    // Reset cards animation
    if (cardRef.current) {
      resetCardElement(cardRef.current);
    }
  };

  useEffect(() => {
    if (currentIndex >= movies.length || timeRemainingSeconds <= 0) return;

    const intervalId = window.setInterval(() => {
      setTimeRemainingSeconds((remaining) => (remaining <= 1 ? 0 : remaining - 1));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [currentIndex, movies.length, timeRemainingSeconds]);

  // Initial card entry animation
  useEffect(() => {
    const card = cardRef.current;
    if (card && currentMovie) {
      set(card, {
        translateX: 0,
        translateY: 0,
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

      return () => {
        entryAnimation.cancel();
      };
    }
  }, [currentMovie]);

  const isDeckFinished = currentIndex >= movies.length || !currentMovie;
  const isTimeUp = isSessionExpired && !isDeckFinished;
  const matchesHref = sessionCode
    ? `/app/matches?session=${encodeURIComponent(sessionCode)}`
    : "/app/matches";

  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const bypassPromptRef = useRef(false);
  const pendingHrefRef = useRef<string | null>(null);

  const handleConfirmLeave = () => {
    bypassPromptRef.current = true;
    if (pendingHrefRef.current) {
      window.location.href = pendingHrefRef.current;
    } else {
      window.location.href = "/app";
    }
  };

  const handleCancelLeave = () => {
    setShowLeaveWarning(false);
    pendingHrefRef.current = null;
  };

  useEffect(() => {
    if (!sessionCode || isDeckFinished || isTimeUp) return;

    // Push dummy state to capture popstate
    window.history.pushState(null, "", window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      if (bypassPromptRef.current || isDeckFinished || isTimeUp) return;
      
      // Put dummy state back to block navigation
      window.history.pushState(null, "", window.location.href);
      setShowLeaveWarning(true);
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (bypassPromptRef.current || isDeckFinished || isTimeUp) return;
      event.preventDefault();
      event.returnValue = "Leaving this page will end your swiping session. Are you sure?";
      return event.returnValue;
    };

    const handleLinkClick = (event: MouseEvent) => {
      if (bypassPromptRef.current || isDeckFinished || isTimeUp) return;
      const target = event.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor && anchor.href && !anchor.href.startsWith("javascript:") && !anchor.href.includes("#")) {
        event.preventDefault();
        event.stopPropagation();
        pendingHrefRef.current = anchor.href;
        setShowLeaveWarning(true);
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleLinkClick, true);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleLinkClick, true);
    };
  }, [sessionCode, isDeckFinished, isTimeUp]);

  if (isDeckFinished || isTimeUp) {
    const likedMovies = swipeDecisions
      .filter((decision) => decision.intent === "like")
      .map((decision) => decision.movie);
    const skippedCount = swipeDecisions.filter(
      (decision) => decision.intent === "skip",
    ).length;
    const hasMatches = likedMovies.length > 0;
    const resultHeadline = isTimeUp
      ? "Time is up"
      : hasMatches
        ? `${likedMovies.length} ${likedMovies.length === 1 ? "match" : "matches"} saved`
        : "No matches this round";
    const resultDetail = isTimeUp
      ? hasMatches
        ? "Your round ended on the timer. These are the titles you liked before time ran out."
        : "Your round ended on the timer before any liked titles were saved."
      : hasMatches
        ? "These are the titles you said yes to before the deck ended."
        : "No liked titles were saved before the deck ended.";

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
                {isTimeUp ? (
                  <Timer className="size-7" />
                ) : hasMatches ? (
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
                  {resultHeadline}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#aeb7c7]">
                  {resultDetail}
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
                href={matchesHref}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/5 px-5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                <Search className="size-4" /> View Matches
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
  const timerProgressPercent = (timeRemainingSeconds / sessionSeconds) * 100;
  const showSessionReminder = timeRemainingSeconds <= SESSION_REMINDER_SECONDS;

  return (
    <>
      <div className="mx-auto w-full max-w-[390px] rounded-[32px] border border-white/14 bg-[#080a12] p-3 shadow-2xl shadow-black/40 relative overflow-hidden">
        <div
          className={`mb-3 rounded-lg border p-3 ${
            showSessionReminder
              ? "border-rose-300/25 bg-rose-300/10"
              : "border-white/10 bg-white/5"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <span
              className={`inline-flex items-center gap-2 text-xs font-black uppercase ${
                showSessionReminder ? "text-rose-100" : "text-[#aeb7c7]"
              }`}
            >
              {showSessionReminder ? (
                <Bell className="size-4 text-rose-200" aria-hidden="true" />
              ) : (
                <Timer className="size-4 text-[#f0b44c]" aria-hidden="true" />
              )}
              {showSessionReminder ? "Finish this round" : "Session timer"}
            </span>
            <span
              role="timer"
              aria-live={showSessionReminder ? "polite" : "off"}
              className={`font-mono text-lg font-black ${
                showSessionReminder ? "text-rose-100" : "text-[#ffd98a]"
              }`}
            >
              {formatSessionTime(timeRemainingSeconds)}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/30">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${
                showSessionReminder ? "bg-rose-300" : "bg-[#2dd4a7]"
              }`}
              style={{ width: `${timerProgressPercent}%` }}
            />
          </div>
        </div>
        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0c111a] relative min-h-[500px]">
          {/* Card stack container */}
          <div
            key={currentMovie.id}
            ref={cardRef}
            onPointerDown={handleCardPointerDown}
            onPointerMove={handleCardPointerMove}
            onPointerUp={finishCardPointerGesture}
            onPointerCancel={cancelCardPointerGesture}
            className="px-4 pb-4 pt-3 flex flex-col justify-between h-full min-h-[480px] opacity-0 select-none cursor-grab active:cursor-grabbing"
            style={{ touchAction: "pan-y" }}
          >
            {/* Interactive Poster Area */}
            <div
              onClick={handlePosterClick}
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
                  draggable={false}
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

      {/* Leave session warning modal */}
      {showLeaveWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101722]/95 p-6 shadow-2xl backdrop-blur-md animate-fade-in">
            <h3 className="text-2xl font-black text-[#fff8ee]">Leave Swiping Session?</h3>
            <p className="mt-3 text-sm leading-6 text-[#aeb7c7]">
              Going back or closing this page will exit the live session. Other participants will still be in the room, but your active swipe run will be interrupted.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleCancelLeave}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 text-xs font-bold text-[#fff8ee] hover:bg-white/10 transition active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLeave}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-rose-500 px-4 text-xs font-bold text-white hover:bg-rose-600 transition active:scale-95"
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render detailed movie modal if clicked */}
      {selectedMovie ? (
        <MovieDetailsModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
      ) : null}
    </>
  );
}
