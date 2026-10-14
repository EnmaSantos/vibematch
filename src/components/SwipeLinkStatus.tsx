"use client";

import { useLinkStatus } from "next/link";
import { LoaderCircle, Play } from "lucide-react";

export default function SwipeLinkStatus() {
  const { pending } = useLinkStatus();

  return (
    <span className="inline-flex items-center gap-2" aria-live="polite">
      {pending ? (
        <span className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true">
          <LoaderCircle className="size-4" />
        </span>
      ) : (
        <Play className="size-4 fill-[#18100b]" aria-hidden="true" />
      )}
      {pending ? "Opening deck…" : "Swipe"}
    </span>
  );
}
