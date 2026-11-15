import Image from "next/image";
import { STAGES, type AvatarStage } from "@/lib/avatar/config";
import { xpForLevel } from "@/lib/avatar/xp";
import { cx } from "@/components/ui";

/**
 * The robot sprite. Always decorative (aria-hidden at call sites via
 * `decorative` or an explicit alt=""); status is conveyed by adjacent text.
 * `priority` only for the single biggest on-screen robot to avoid lazy
 * waterfall on the home hero; the gallery stays lazy.
 */
export function Avatar({
  level,
  size = 96,
  decorative = true,
  priority = false,
  className,
}: {
  level: number;
  size?: number;
  decorative?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const clamped = Math.min(Math.max(level, 1), STAGES.length);
  return (
    <Image
      src={`/avatar/level-${clamped}.png`}
      alt={decorative ? "" : `Level ${clamped} robot`}
      width={size}
      height={size}
      priority={priority}
      className={cx("select-none", className)}
      draggable={false}
    />
  );
}

/** Level chip: icon + text, never color alone. */
export function LevelChip({ level, className }: { level: number; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full bg-cic-dark px-2.5 py-0.5 text-xs font-bold whitespace-nowrap text-white",
        className,
      )}
    >
      Lv {level}
    </span>
  );
}

/** Next-unlock teaser line for the evolution card + gallery. */
export function NextTeaser({ stage, className }: { stage: AvatarStage; className?: string }) {
  if (!stage.nextTeaser) {
    return (
      <p className={cx("text-sm font-bold text-cic-dark", className)}>
        🎉 Fully evolved — the ultimate Golden Mind!
      </p>
    );
  }
  return (
    <p className={cx("text-sm text-cic-muted", className)}>
      <span className="font-bold text-cic-darker">Next:</span> {stage.nextTeaser}
    </p>
  );
}

/** Re-export for call sites that only import from the avatar folder. */
export { STAGES, xpForLevel };
