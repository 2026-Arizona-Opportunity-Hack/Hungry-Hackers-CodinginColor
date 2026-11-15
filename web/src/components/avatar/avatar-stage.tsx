"use client";

import { Avatar } from "./avatar";
import { SHOP_BACKDROPS, SHOP_COLORS, type ShopColor } from "@/lib/avatar/config";
import { cx } from "@/components/ui";

/**
 * Robot on its stage: colored glow ring + backdrop + floating pet emoji.
 * All decorative (aria-hidden); the card supplies the text alternative.
 */
export function AvatarStage({
  level,
  colorId,
  backdropId,
  petId,
  petEmoji,
  size = 160,
  priority = false,
  className,
}: {
  level: number;
  colorId: string;
  backdropId: string;
  petId: string;
  petEmoji: string;
  size?: number;
  priority?: boolean;
  className?: string;
}) {
  const color: ShopColor = SHOP_COLORS.find((c) => c.id === colorId) ?? SHOP_COLORS[0];
  const backdrop = SHOP_BACKDROPS.find((b) => b.id === backdropId) ?? SHOP_BACKDROPS[0];
  const float = size > 120;

  return (
    <div
      aria-hidden
      className={cx(
        "relative grid place-items-center overflow-hidden rounded-3xl border-2 border-cic-line bg-gradient-to-b",
        backdrop.classes,
        className,
      )}
      style={{ width: size * 1.25, height: size * 1.25 }}
    >
      <span
        className="absolute rounded-full opacity-30 blur-xl"
        style={{ width: size * 0.85, height: size * 0.85, background: color.swatch }}
      />
      <span className={float ? "animate-avatar-float" : undefined}>
        <Avatar level={level} size={size} priority={priority} />
      </span>
      {petId !== "none" && petEmoji && (
        <span
          className={cx("absolute right-2 bottom-2 text-2xl", float && "animate-avatar-bob")}
          aria-hidden
        >
          {petEmoji}
        </span>
      )}
    </div>
  );
}

/**
 * Companion pet chip used on locked/unlocked shop rows: emoji + name,
 * or a silhouette "?" when locked.
 */
export function PetChip({ emoji, label, locked }: { emoji: string; label: string; locked?: boolean }) {
  if (locked) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-cic-tint px-2 py-0.5 text-xs font-bold text-cic-muted">
        <span aria-hidden>🔒</span> {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-cic-tint px-2 py-0.5 text-xs font-bold text-cic-darker">
      <span aria-hidden>{emoji}</span> {label}
    </span>
  );
}
