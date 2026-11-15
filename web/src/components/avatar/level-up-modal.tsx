"use client";

import { useEffect, useRef } from "react";
import { PartyPopper } from "lucide-react";
import { Button } from "@/components/ui";
import { STAGES } from "@/lib/avatar/config";
import { Avatar } from "./avatar";

/**
 * One-time celebration when the robot levels up. role=dialog + aria-modal,
 * focus moves to the button on open and returns to the invoker on close.
 * Esc closes. Shown once per level (guarded by `lastSeenLevel` in repo.ts).
 */
export function LevelUpModal({
  level,
  robotName,
  onClose,
}: {
  level: number;
  robotName: string;
  onClose: () => void;
}) {
  const stage = STAGES[level - 1] ?? STAGES[0];
  const closeRef = useRef<HTMLButtonElement>(null);
  const invokerRef = useRef<Element | null>(null);

  useEffect(() => {
    invokerRef.current = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      // Simple focus trap: keep Tab cycling inside the dialog.
      if (e.key === "Tab") {
        const root = document.getElementById("levelup-dialog");
        if (!root) return;
        const items = [...root.querySelectorAll<HTMLElement>("button, [href], [tabindex]:not([tabindex='-1'])")].filter(
          (el) => !el.hasAttribute("disabled"),
        );
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      (invokerRef.current as HTMLElement | null)?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        id="levelup-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="levelup-title"
        className="relative w-full max-w-sm animate-pop rounded-3xl border-2 border-cic-dark bg-white p-6 text-center shadow-slab"
      >
        <PartyPopper aria-hidden className="mx-auto size-10 text-cic-dark" />
        <h2 id="levelup-title" className="mt-2 font-display text-3xl text-cic-dark">
          {robotName} leveled up!
        </h2>
        <p className="mt-1 font-bold">
          Level {level}: {stage.title}
        </p>
        <Avatar level={level} size={160} priority className="mx-auto mt-3 h-40 w-40" />
        <p className="mt-3 text-cic-muted">{stage.tagline}</p>
        {stage.nextTeaser ? (
          <p className="mt-1 text-sm text-cic-muted">
            <span className="font-bold text-cic-darker">Next:</span> {stage.nextTeaser}
          </p>
        ) : (
          <p className="mt-1 text-sm font-bold text-cic-dark">Fully evolved — the ultimate Golden Mind!</p>
        )}
        <Button ref={closeRef} onClick={onClose} className="mt-5 w-full">
          Keep learning
        </Button>
      </div>
    </div>
  );
}
