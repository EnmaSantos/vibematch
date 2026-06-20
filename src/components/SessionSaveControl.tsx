"use client";

import { useState, useTransition } from "react";
import { Bookmark, Check, Loader2 } from "lucide-react";
import { setSessionSaved } from "@/app/app/actions";

type SessionSaveControlProps = {
  sessionId: string;
  initialSaved: boolean;
};

export default function SessionSaveControl({
  sessionId,
  initialSaved,
}: SessionSaveControlProps) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const toggleSaved = () => {
    setError("");

    startTransition(async () => {
      try {
        const result = await setSessionSaved(sessionId, !isSaved);
        setIsSaved(result.saved);
      } catch (saveError) {
        setError(
          saveError instanceof Error ? saveError.message : "Could not update this session",
        );
      }
    });
  };

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <button
        type="button"
        onClick={toggleSaved}
        disabled={isPending}
        aria-pressed={isSaved}
        className={`inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg px-3 text-xs font-black transition disabled:cursor-wait disabled:opacity-70 ${
          isSaved
            ? "border border-emerald-300/25 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/15"
            : "bg-[#f0b44c] text-[#18100b] hover:bg-[#ffd06f]"
        }`}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : isSaved ? (
          <Check className="size-4" aria-hidden="true" />
        ) : (
          <Bookmark className="size-4" aria-hidden="true" />
        )}
        {isPending
          ? "Updating..."
          : isSaved
            ? "Saved to your history"
            : "Save this session"}
      </button>
      <p className="mt-2 text-center text-[11px] leading-5 text-[#8f9bad]">
        {isSaved
          ? "It will stay in Recent rooms. Tap again to remove it without deleting the room."
          : "Optional—temporary sessions do not appear in your history."}
      </p>
      {error ? (
        <p className="mt-2 text-center text-[11px] font-bold text-rose-200" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
