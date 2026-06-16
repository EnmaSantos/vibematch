"use client";

import { useFormStatus } from "react-dom";
import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";

interface AnimatedSubmitProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function AnimatedSubmit({
  children,
  className,
  ...props
}: AnimatedSubmitProps) {
  const { pending } = useFormStatus();
  const textRef = useRef<HTMLSpanElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<any>(null);

  useEffect(() => {
    // Satisfy TypeScript strict null checks
    if (!textRef.current || !dotsRef.current) return;

    if (pending) {
      // Fade out standard button text
      animate(textRef.current, {
        opacity: [1, 0],
        scale: [1, 0.9],
        duration: 250,
        ease: "outQuad", // Correct Anime.js v4 easing name (no "ease" prefix)
      });

      // Fade in and stagger animate the loading dots
      animate(dotsRef.current, {
        opacity: [0, 1],
        scale: [0.8, 1],
        duration: 300,
        ease: "outBack", // Correct Anime.js v4 easing name
      });

      // Loop bounce animation on loading dots
      const dots = dotsRef.current.querySelectorAll(".dot");
      if (dots.length > 0) {
        animationRef.current = animate(dots, {
          translateY: [0, -6, 0],
          delay: stagger(150),
          duration: 700,
          loop: true,
          ease: "inOutQuad", // Correct Anime.js v4 easing name
        });
      }
    } else {
      // Clean up looping animation
      if (animationRef.current) {
        animationRef.current.pause();
        animationRef.current = null;
      }

      // Reset to original button state
      animate(textRef.current, {
        opacity: [0, 1],
        scale: [0.95, 1],
        duration: 200,
        ease: "outQuad", // Correct Anime.js v4 easing name
      });

      animate(dotsRef.current, {
        opacity: [1, 0],
        duration: 150,
        ease: "inQuad", // Correct Anime.js v4 easing name
      });
    }
  }, [pending]);

  return (
    <button
      type="submit"
      disabled={pending}
      className={`relative inline-flex items-center justify-center overflow-hidden transition-colors ${className}`}
      {...props}
    >
      {/* Loading state indicator */}
      <div
        ref={dotsRef}
        className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 pointer-events-none text-current"
        aria-hidden="true"
      >
        <span className="dot size-2 rounded-full bg-current"></span>
        <span className="dot size-2 rounded-full bg-current"></span>
        <span className="dot size-2 rounded-full bg-current"></span>
      </div>

      {/* Normal text state */}
      <span ref={textRef} className="inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}
