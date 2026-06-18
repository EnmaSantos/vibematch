"use client";

import { useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { animate } from "animejs";
import { signOut } from "@/app/auth/actions";

function removeOverlay(overlay: HTMLDivElement | null) {
  if (overlay?.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
}

export default function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  const handleSignOut = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isSigningOut) return;
    setIsSigningOut(true);

    // Keep this overlay temporary; App Router navigation preserves document.body.
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.backgroundColor = "black";
    overlay.style.opacity = "0";
    overlay.style.zIndex = "9999";
    overlay.style.pointerEvents = "none";
    document.body.appendChild(overlay);

    // Play sign out animations
    const animations = [];

    // Fade out overlay screen
    animations.push(
      animate(overlay, {
        opacity: [0, 0.75],
        duration: 450,
        ease: "outQuad",
      })
    );

    // Spin/Slide logout icon out
    if (iconRef.current) {
      animations.push(
        animate(iconRef.current, {
          rotate: [0, -360],
          translateX: [0, 24],
          opacity: [1, 0],
          scale: [1, 0.7],
          duration: 400,
          ease: "outQuad",
        })
      );
    }

    // Fade and slide text out
    if (textRef.current) {
      animations.push(
        animate(textRef.current, {
          opacity: [1, 0],
          translateX: [0, -12],
          duration: 300,
          ease: "outQuad",
        })
      );
    }

    // Shrink button border/bg
    if (buttonRef.current) {
      animations.push(
        animate(buttonRef.current, {
          scale: [1, 0.92],
          borderColor: ["rgba(255,255,255,0.12)", "rgba(255,255,255,0)"],
          backgroundColor: ["rgba(255,255,255,0.08)", "rgba(255,255,255,0)"],
          duration: 400,
          ease: "outQuad",
        })
      );
    }

    try {
      await Promise.all(animations);
      removeOverlay(overlay);
      await signOut();
    } catch (error) {
      removeOverlay(overlay);
      setIsSigningOut(false);
      throw error;
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/8 text-[#fff8ee] hover:bg-white/12 sm:h-10 px-3 sm:px-4 active:scale-95 transition-all"
      title="Sign out"
    >
      <span ref={iconRef} className="inline-flex items-center justify-center">
        <LogOut className="size-4" />
      </span>
      <span ref={textRef} className="hidden sm:inline text-sm font-bold">
        {isSigningOut ? "Signing out..." : "Sign out"}
      </span>
    </button>
  );
}
