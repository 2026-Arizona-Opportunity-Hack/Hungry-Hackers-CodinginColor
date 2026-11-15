import { STAGES, XP_THRESHOLDS } from "./config";

/** Pure helpers: XP -> level and gallery lock state. No storage, no side effects. */

/** 1-based level for a total XP value (never below 1 or above 10). */
export function levelForXp(xp: number): number {
  let level = 1;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

/** XP needed to reach `level` (1-based). Level 1 needs 0. */
export function xpForLevel(level: number): number {
  const i = Math.min(Math.max(level, 1), XP_THRESHOLDS.length) - 1;
  return XP_THRESHOLDS[i];
}

/** XP still needed to reach the next level, or 0 at max level. */
export function xpToNext(xp: number): number {
  const level = levelForXp(xp);
  if (level >= STAGES.length) return 0;
  return Math.max(0, xpForLevel(level + 1) - xp);
}

export type GalleryStatus = "seen" | "current" | "locked";

/** Gallery tile state for `stage` given the student's current level. */
export function galleryStatus(stageLevel: number, currentLevel: number): GalleryStatus {
  if (stageLevel < currentLevel) return "seen";
  if (stageLevel === currentLevel) return "current";
  return "locked";
}
