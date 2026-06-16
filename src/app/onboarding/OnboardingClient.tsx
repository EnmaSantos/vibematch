"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { animate } from "animejs";
import {
  Film,
  Sparkles,
  Heart,
  ChevronRight,
  ChevronLeft,
  Tv,
  Clock,
  ThumbsUp,
  Volume2,
} from "lucide-react";
import { saveOnboardingPreferences } from "./actions";

const GENRES = [
  { name: "Action", emoji: "💥" },
  { name: "Adventure", emoji: "🤠" },
  { name: "Animation", emoji: "🦄" },
  { name: "Comedy", emoji: "😂" },
  { name: "Crime", emoji: "🕵️‍♂️" },
  { name: "Documentary", emoji: "📹" },
  { name: "Drama", emoji: "🎭" },
  { name: "Family", emoji: "🍿" },
  { name: "Fantasy", emoji: "🪄" },
  { name: "History", emoji: "📜" },
  { name: "Horror", emoji: "🧟" },
  { name: "Music", emoji: "🎸" },
  { name: "Mystery", emoji: "🔍" },
  { name: "Romance", emoji: "💖" },
  { name: "Science Fiction", emoji: "🚀" },
  { name: "Thriller", emoji: "🔪" },
  { name: "War", emoji: "🎖️" },
  { name: "Western", emoji: "🌵" },
];

const MOODS = [
  { name: "Cozy", description: "Warm, relaxing, low stakes", emoji: "☕" },
  { name: "Funny", description: "Lighthearted, laugh-out-loud", emoji: "🤪" },
  { name: "Thrilling", description: "Edge-of-your-seat suspense", emoji: "🧗" },
  { name: "Heartwarming", description: "Sweet, emotional, feel-good", emoji: "🥺" },
  { name: "Thought-provoking", description: "Deep, intellectual, reflective", emoji: "🧠" },
  { name: "Dark", description: "Gritty, intense, psychological", emoji: "🖤" },
  { name: "Romantic", description: "Passionate, sweet, love stories", emoji: "🌹" },
  { name: "Mind-bending", description: "Surreal, complex plot twists", emoji: "🌀" },
];

const RUNTIMES = [
  { name: "Short", detail: "Under 90 minutes", range: "Under 90m" },
  { name: "Standard", detail: "90 to 120 minutes", range: "90m-120m" },
  { name: "Long", detail: "Over 2 hours", range: "Over 2h" },
  { name: "Anything", detail: "Let the vibes decide", range: "Anything" },
];

interface OnboardingClientProps {
  userEmail: string;
}

export default function OnboardingClient({ userEmail }: OnboardingClientProps) {
  const [step, setStep] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedRuntime, setSelectedRuntime] = useState("Anything");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Handle slide animations between steps
  const goToStep = (nextStep: number) => {
    if (!stepRef.current) return;

    // Slide out old step
    animate(stepRef.current, {
      opacity: [1, 0],
      translateX: [0, nextStep > step ? -100 : 100],
      duration: 250,
      ease: "outQuad",
    }).then(() => {
      setStep(nextStep);
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Slide in new step
      animate(stepRef.current, {
        opacity: [0, 1],
        translateX: [nextStep > step ? 100 : -100, 0],
        duration: 350,
        ease: "outBack",
      });
    });
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const toggleMood = (mood: string) => {
    setSelectedMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      await saveOnboardingPreferences({
        favoriteGenres: selectedGenres,
        moodPreferences: selectedMoods,
        runtimePreference: selectedRuntime,
      });

      // Animate card container fade-out on success
      if (containerRef.current) {
        await animate(containerRef.current, {
          scale: [1, 0.95],
          opacity: [1, 0],
          duration: 400,
          ease: "outQuad",
        });
      }

      router.push("/app");
      router.refresh();
    } catch (e: any) {
      setError(e.message || "Something went wrong saving preferences.");
      setSubmitting(false);
    }
  };

  // Initial fade-in of the onboarding card
  useEffect(() => {
    if (containerRef.current) {
      animate(containerRef.current, {
        opacity: [0, 1],
        scale: [0.95, 1],
        duration: 600,
        ease: "outBack",
      });
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="mx-auto w-full max-w-2xl rounded-2xl border border-white/12 bg-[#101722]/80 p-6 shadow-2xl backdrop-blur-md sm:p-8 opacity-0"
    >
      {/* Progress Header */}
      <div className="mb-8 flex items-center justify-between border-b border-white/8 pb-4">
        <div>
          <span className="text-xs font-bold uppercase text-[#f0b44c]">Onboarding</span>
          <h2 className="text-lg font-black text-white">Setup Preferences</h2>
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-8 rounded-full transition-all duration-300 ${
                s === step
                  ? "bg-[#f0b44c] w-12"
                  : s < step
                  ? "bg-emerald-400"
                  : "bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-300/25 bg-rose-300/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {/* Interactive Step Content container */}
      <div ref={stepRef} className="will-change-transform">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-black text-[#fff8ee] flex items-center gap-2">
                <Film className="size-6 text-[#f0b44c]" /> What movie genres do you love?
              </h3>
              <p className="mt-1 text-sm text-[#8f9bad]">
                Select the genres that make you hit Play. We'll prioritize these in your matches.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {GENRES.map((g) => {
                const selected = selectedGenres.includes(g.name);
                return (
                  <button
                    key={g.name}
                    type="button"
                    onClick={() => toggleGenre(g.name)}
                    className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-left text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                      selected
                        ? "border-[#f0b44c] bg-[#f0b44c]/10 text-[#ffd98a] shadow-md shadow-[#f0b44c]/5"
                        : "border-white/8 bg-[#0c111a]/40 text-[#c5cedc] hover:border-white/20 hover:bg-[#0c111a]/60"
                    }`}
                  >
                    <span className="text-xl">{g.emoji}</span>
                    <span>{g.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => goToStep(2)}
                disabled={selectedGenres.length === 0}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#f0b44c] px-6 text-sm font-bold text-[#18100b] hover:bg-[#ffd06f] disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                Continue
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-black text-[#fff8ee] flex items-center gap-2">
                <Sparkles className="size-6 text-[#2dd4a7]" /> What is the couch vibe?
              </h3>
              <p className="mt-1 text-sm text-[#8f9bad]">
                What mood or tone are you usually searching for when deciding what to watch?
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {MOODS.map((m) => {
                const selected = selectedMoods.includes(m.name);
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => toggleMood(m.name)}
                    className={`flex items-start gap-3.5 rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                      selected
                        ? "border-[#2dd4a7] bg-[#2dd4a7]/10 text-white shadow-md shadow-[#2dd4a7]/5"
                        : "border-white/8 bg-[#0c111a]/40 text-[#c5cedc] hover:border-white/20 hover:bg-[#0c111a]/60"
                    }`}
                  >
                    <span className="text-2xl shrink-0 mt-0.5">{m.emoji}</span>
                    <div>
                      <span className="block font-black text-sm">{m.name}</span>
                      <span className="block text-xs text-[#8f9bad] mt-0.5 leading-relaxed">
                        {m.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/5 px-5 text-sm font-bold text-[#fff8ee] hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="size-4" />
                Back
              </button>
              <button
                type="button"
                onClick={() => goToStep(3)}
                disabled={selectedMoods.length === 0}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#f0b44c] px-6 text-sm font-bold text-[#18100b] hover:bg-[#ffd06f] disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                Continue
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-black text-[#fff8ee] flex items-center gap-2">
                <Clock className="size-6 text-[#c8b6ff]" /> Preferences & Runtime
              </h3>
              <p className="mt-1 text-sm text-[#8f9bad]">
                Set limits on how long the movie should be before you swipe.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {RUNTIMES.map((r) => {
                const selected = selectedRuntime === r.range;
                return (
                  <button
                    key={r.name}
                    type="button"
                    onClick={() => setSelectedRuntime(r.range)}
                    className={`flex flex-col rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                      selected
                        ? "border-[#c8b6ff] bg-[#c8b6ff]/10 text-[#fff8ee] shadow-md shadow-[#c8b6ff]/5"
                        : "border-white/8 bg-[#0c111a]/40 text-[#c5cedc] hover:border-white/20 hover:bg-[#0c111a]/60"
                    }`}
                  >
                    <span className="font-black text-sm">{r.name}</span>
                    <span className="text-xs text-[#8f9bad] mt-1">{r.detail}</span>
                  </button>
                );
              })}
            </div>

            {/* Nice onboarding review card */}
            <div className="rounded-xl border border-white/5 bg-[#0c111a]/60 p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase text-[#f0b44c] flex items-center gap-1.5">
                <ThumbsUp className="size-3.5" /> Selection summary
              </h4>
              <div className="text-xs space-y-1.5 text-[#aeb7c7]">
                <p>
                  <strong>Genres:</strong>{" "}
                  {selectedGenres.length > 0 ? selectedGenres.join(", ") : "None chosen"}
                </p>
                <p>
                  <strong>Vibes:</strong>{" "}
                  {selectedMoods.length > 0 ? selectedMoods.join(", ") : "None chosen"}
                </p>
                <p>
                  <strong>Max Duration:</strong> {selectedRuntime}
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => goToStep(2)}
                disabled={submitting}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/5 px-5 text-sm font-bold text-[#fff8ee] hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="size-4" />
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#2dd4a7] px-6 text-sm font-bold text-[#061b16] hover:bg-[#4ade80] disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                {submitting ? "Saving preferences..." : "Finish Onboarding"}
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
