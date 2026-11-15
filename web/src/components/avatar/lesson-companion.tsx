"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AvatarStage, SpeechBubble } from "@/components/avatar";
import { levelForXp } from "@/lib/avatar/xp";
import { awardXp } from "@/lib/repo";
import { useStudent } from "@/lib/use-student";
import { useAvatar } from "@/components/avatar";

/**
 * Corner companion on lesson pages: the student's own robot, small, with a
 * rotating encouragement bubble. pointer-events-none on the wrapper so it
 * never covers Continue; only the bubble's close button is clickable.
 */
const LINES = [
  "You've got this — one step at a time!",
  "First tries earn bonus XP. Give it a shot!",
  "Stuck? Try a hint — that's what they're for.",
  "Every activity makes me stronger!",
  "Take a breath. Read it once more, slowly.",
];

export function LessonCompanion({ moduleNumber }: { moduleNumber: number }) {
  const ctx = useStudent();
  const path = usePathname();
  const [line, setLine] = useState(0);
  const [hidden, setHidden] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setHidden(false);
    setLine(Math.floor(Math.random() * LINES.length));
    timer.current = window.setTimeout(() => setHidden(true), 20000);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [path, moduleNumber]);

  if (!ctx || hidden) return null;
  const { avatar, baseXp, bonusXp } = ctx;
  const level = levelForXp(baseXp + bonusXp);

  return (
    <div aria-hidden={false} className="pointer-events-none fixed right-3 bottom-20 z-30 flex flex-col items-end gap-1 md:bottom-6">
      <SpeechBubble text={LINES[line % LINES.length]} onClose={() => setHidden(true)} />
      <span className="pointer-events-auto animate-avatar-bob">
        <AvatarStage
          level={level}
          colorId={avatar.color}
          backdropId={avatar.backdrop}
          petId={avatar.pet}
          petEmoji=""
          size={64}
        />
      </span>
    </div>
  );
}

/** Wire used by the lesson page: awards + ids for the module-complete card. */
export function useLessonAwards() {
  const ctx = useStudent();
  const avatar = useAvatarSafe();
  const [breakdown, setBreakdown] = useState<{ label: string; amount: number }[]>([]);

  function grant(key: string, amount: number, label: string) {
    if (!ctx) return false;
    const ok = awardXp(ctx.cls.id, ctx.student.id, key, amount);
    if (ok) {
      setBreakdown((b) => [...b, { label, amount }]);
      avatar?.refresh();
    }
    return ok;
  }

  return { breakdown, grant, clear: () => setBreakdown([]) };
}

function useAvatarSafe() {
  try {
    return useAvatar();
  } catch {
    return null;
  }
}
