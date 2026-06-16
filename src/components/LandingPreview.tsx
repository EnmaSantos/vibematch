"use client";

import { useEffect, useRef, useState } from "react";
import { Timer, Heart, Sparkles } from "lucide-react";
import { animate } from "animejs";

const DEMO_MOVIES = [
  {
    title: "Midnight Radio",
    year: "2022",
    runtime: "1h 47m",
    genres: ["Mystery", "Sci-fi"],
    providers: ["Netflix", "Apple TV", "Amazon"],
    gradient: "linear-gradient(145deg, #2d1b69, #8a3ffc 50%, #f05d5e)",
  },
  {
    title: "Elvis",
    year: "2022",
    runtime: "2h 39m",
    genres: ["Music", "Drama"],
    providers: ["Max", "YouTube", "Amazon"],
    gradient: "linear-gradient(145deg, #32120f, #b9472f 50%, #f2b84b)",
  },
  {
    title: "Past Lives",
    year: "2023",
    runtime: "1h 46m",
    genres: ["Romance", "Drama"],
    providers: ["Max", "Apple TV", "Amazon"],
    gradient: "linear-gradient(145deg, #113542, #3d7e8f 50%, #f4b08b)",
  },
];

export default function LandingPreview() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchVisible, setMatchVisible] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(42); // Match original 00:42 starting point
  const cardRef = useRef<HTMLDivElement>(null);
  const likeBtnRef = useRef<HTMLSpanElement>(null);
  const skipBtnRef = useRef<HTMLSpanElement>(null);
  const matchOverlayRef = useRef<HTMLDivElement>(null);

  const currentMovie = DEMO_MOVIES[currentIndex];

  // Tick the timer down every second
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 60));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    let active = true;

    const runDemoSwipeCycle = async () => {
      // Wait 3.5 seconds to show the current movie
      await new Promise((r) => setTimeout(r, 3500));
      if (!active) return;

      const card = cardRef.current;
      const likeBtn = likeBtnRef.current;
      const skipBtn = skipBtnRef.current;

      if (!card || !likeBtn || !skipBtn) return;

      const swipeDirection = currentIndex % 3 === 0 ? "right" : currentIndex % 3 === 1 ? "left" : "match";

      if (swipeDirection === "right") {
        // Highlight Like button with glow
        animate(likeBtn, {
          scale: [1, 1.12, 1],
          backgroundColor: ["rgba(45,212,167,0)", "rgba(45,212,167,0.18)", "rgba(45,212,167,0)"],
          boxShadow: [
            "0 0 0 0 rgba(45, 212, 167, 0)",
            "0 0 16px 4px rgba(45, 212, 167, 0.4)",
            "0 0 0 0 rgba(45, 212, 167, 0)"
          ],
          duration: 500,
          ease: "outQuad",
        });

        // Swipe right animation (softer translation/rotation)
        await animate(card, {
          translateX: [0, 180],
          rotate: [0, 6],
          opacity: [1, 0],
          duration: 750,
          ease: "outQuad",
        }).then;

        if (!active) return;
        setCurrentIndex((prev) => (prev + 1) % DEMO_MOVIES.length);
        
        // Reset card pos
        card.style.transform = "translateX(0px) rotate(0deg)";
        card.style.opacity = "0";

        // Fade in new card
        animate(card, {
          scale: [0.95, 1],
          opacity: [0, 1],
          duration: 450,
          ease: "outQuad",
        });

      } else if (swipeDirection === "left") {
        // Highlight Skip button with glow
        animate(skipBtn, {
          scale: [1, 1.12, 1],
          backgroundColor: ["rgba(244,63,94,0)", "rgba(244,63,94,0.18)", "rgba(244,63,94,0)"],
          boxShadow: [
            "0 0 0 0 rgba(244, 63, 94, 0)",
            "0 0 16px 4px rgba(244, 63, 94, 0.4)",
            "0 0 0 0 rgba(244, 63, 94, 0)"
          ],
          duration: 500,
          ease: "outQuad",
        });

        // Swipe left animation (softer translation/rotation)
        await animate(card, {
          translateX: [0, -180],
          rotate: [0, -6],
          opacity: [1, 0],
          duration: 750,
          ease: "outQuad",
        }).then;

        if (!active) return;
        setCurrentIndex((prev) => (prev + 1) % DEMO_MOVIES.length);

        // Reset card pos
        card.style.transform = "translateX(0px) rotate(0deg)";
        card.style.opacity = "0";

        // Fade in new card
        animate(card, {
          scale: [0.95, 1],
          opacity: [0, 1],
          duration: 450,
          ease: "outQuad",
        });

      } else {
        // Highlight Like button (triggers match!)
        animate(likeBtn, {
          scale: [1, 1.12, 1],
          backgroundColor: ["rgba(45,212,167,0)", "rgba(45,212,167,0.18)", "rgba(45,212,167,0)"],
          boxShadow: [
            "0 0 0 0 rgba(45, 212, 167, 0)",
            "0 0 20px 8px rgba(45, 212, 167, 0.5)",
            "0 0 0 0 rgba(45, 212, 167, 0)"
          ],
          duration: 500,
          ease: "outQuad",
        });

        // Show Match Overlay
        setMatchVisible(true);
        
        // Wait overlay fade-in
        await new Promise((r) => setTimeout(r, 100));
        
        const overlay = matchOverlayRef.current;
        if (overlay) {
          animate(overlay, {
            scale: [0.9, 1],
            opacity: [0, 1],
            duration: 500,
            ease: "outBack",
          });
        }

        // Hold the match overlay for 3 seconds
        await new Promise((r) => setTimeout(r, 3000));
        if (!active) return;

        // Fade out overlay
        const overlayAfter = matchOverlayRef.current;
        if (overlayAfter) {
          await animate(overlayAfter, {
            scale: [1, 0.95],
            opacity: [1, 0],
            duration: 450,
            ease: "inQuad",
          }).then;
        }

        setMatchVisible(false);
        setCurrentIndex((prev) => (prev + 1) % DEMO_MOVIES.length);
      }

      // Start next cycle
      runDemoSwipeCycle();
    };

    runDemoSwipeCycle();

    return () => {
      active = false;
    };
  }, [currentIndex]);

  return (
    <div className="mx-0 w-full max-w-[300px] rounded-[32px] border border-white/14 bg-[#080a12] p-3 shadow-2xl shadow-black/40 sm:mx-auto sm:max-w-[390px] relative overflow-hidden">
      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0c111a] relative min-h-[460px]">
        {/* Phone Header */}
        <div className="flex h-12 items-center justify-between px-5 border-b border-white/5 bg-black/10">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-[#f0b44c]">
            <Timer className="size-4" aria-hidden="true" />
            Live round | {formatTime(secondsLeft)}
          </span>
          <span className="h-1.5 w-16 rounded-full bg-white/18" />
        </div>

        {/* Match Overlay */}
        {matchVisible && (
          <div
            ref={matchOverlayRef}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-5 text-center opacity-0"
          >
            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-400/25 mb-4 animate-bounce">
              <Heart className="size-8 fill-emerald-400" />
            </div>
            <h3 className="text-2xl font-black text-white flex items-center gap-1.5 justify-center">
              <Sparkles className="size-5 text-[#f0b44c]" />
              IT'S A MATCH!
            </h3>
            <p className="mt-2 text-sm text-[#aeb7c7] max-w-[200px]">
              You and Alex both liked <strong>{currentMovie.title}</strong>!
            </p>
          </div>
        )}

        {/* Swiping Movie Card Container */}
        <div ref={cardRef} className="px-4 pb-4 pt-3 flex flex-col justify-between h-[calc(100%-48px)] transition-all">
          
          {/* Movie Poster Art Card */}
          <div
            className="relative overflow-hidden rounded-lg border border-white/15 shadow-xl shadow-black/35 aspect-[3/4]"
            style={{ background: currentMovie.gradient }}
          >
            <div className="absolute inset-x-5 top-6 h-4 rounded-full bg-white/20" />
            <div className="absolute right-7 top-14 size-16 rounded-full border border-white/25 bg-white/15" />
            <div className="absolute left-7 top-24 h-28 w-16 rounded-full border border-white/20 bg-black/15" />
            <div className="absolute inset-x-6 bottom-24 h-1.5 rounded-full bg-white/30" />
            
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-5">
              <p className="font-black leading-tight text-white text-2xl">
                {currentMovie.title}
              </p>
              <p className="mt-2 text-xs font-bold text-white/75">
                {currentMovie.year} | {currentMovie.genres.join(", ")}
              </p>
            </div>
          </div>

          {/* Details below card */}
          <div className="space-y-3 pt-3">
            <div>
              <h4 className="text-lg font-black leading-tight text-[#fff8ee] line-clamp-1">
                {currentMovie.title}
              </h4>
              <p className="text-[11px] font-bold text-[#f0b44c]">
                {currentMovie.year} | {currentMovie.runtime} | {currentMovie.genres.join(", ")}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {currentMovie.providers.map((p) => (
                <span
                  key={p}
                  className="inline-flex h-6 items-center rounded-md border border-emerald-300/15 bg-emerald-300/8 px-2 text-[10px] font-bold text-emerald-100"
                >
                  {p}
                </span>
              ))}
            </div>

            {/* Buttons skip/like */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <span
                ref={skipBtnRef}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-rose-200/15 bg-rose-300/10 text-xs font-bold text-rose-100 transition duration-300"
              >
                Skip
              </span>
              <span
                ref={likeBtnRef}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-emerald-200/15 bg-emerald-300/14 text-xs font-bold text-emerald-100 transition duration-300"
              >
                <Heart className="size-3.5 fill-emerald-100" />
                Like
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
