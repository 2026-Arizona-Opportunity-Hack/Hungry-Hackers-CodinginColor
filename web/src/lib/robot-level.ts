/**
 * Robot avatar levels. Students earn 10 XP per finished activity, and their
 * robot grows a stage each time they cross one of these thresholds.
 * The intro course has ~33 activities (~330 XP), so finishing it reaches Level 10.
 * Tweak the numbers here to make levelling faster or slower.
 */
export const LEVEL_XP = [0, 10, 30, 60, 90, 130, 170, 210, 260, 320] as const;

export const MAX_LEVEL = LEVEL_XP.length;

export interface RobotLevel {
  level: number;
  /** XP needed to reach the next level, or null at the top level. */
  nextAt: number | null;
  /** 0..1 progress from this level's threshold to the next. */
  toNext: number;
  image: string;
}

export function robotLevel(xp: number): RobotLevel {
  const safeXp = Math.max(0, Number.isFinite(xp) ? xp : 0);
  let level = 1;
  for (let i = 0; i < LEVEL_XP.length; i++) if (safeXp >= LEVEL_XP[i]) level = i + 1;
  const start = LEVEL_XP[level - 1];
  const nextAt = level < MAX_LEVEL ? LEVEL_XP[level] : null;
  const toNext = nextAt === null ? 1 : (safeXp - start) / (nextAt - start);
  return { level, nextAt, toNext, image: robotImage(level) };
}

export function robotImage(level: number): string {
  const n = Math.min(MAX_LEVEL, Math.max(1, Math.round(level)));
  return `/robot/level-${n}.webp`;
}
