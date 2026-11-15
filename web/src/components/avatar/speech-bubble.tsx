"use client";

import { useEffect, useRef } from "react";
import { cx } from "@/components/ui";

/**
 * Corner speech bubble. Never traps or steals focus; sibling content (like
 * Continue) stays clickable because the wrapper is pointer-events-none and
 * only the bubble itself opts back in.
 */
export function SpeechBubble({
  text,
  onClose,
  livePolite = true,
  className,
}: {
  text: string;
  onClose?: () => void;
  livePolite?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Auto-dismissing bubbles shouldn't strand keyboard focus inside them.
  useEffect(() => {
    if (!onClose || !ref.current) return;
    const el = ref.current;
    const t = setTimeout(() => {
      if (el.contains(document.activeElement)) {
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
      onClose();
    }, 8000);
    return () => clearTimeout(t);
  }, [onClose, text]);

  return (
    <div
      ref={ref}
      role="status"
      aria-live={livePolite ? "polite" : "off"}
      className={cx(
        "pointer-events-auto relative max-w-56 animate-pop rounded-2xl rounded-br-md border-2 border-cic-dark bg-white p-3 text-sm font-bold text-cic-darker shadow-slab",
        className,
      )}
    >
      {text}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Hide message"
          className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full border-2 border-cic-dark bg-white text-xs font-black text-cic-dark"
        >
          ×
        </button>
      )}
    </div>
  );
}
