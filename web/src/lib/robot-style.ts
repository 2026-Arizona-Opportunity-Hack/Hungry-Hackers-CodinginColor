"use client";

import { useSyncExternalStore } from "react";

/**
 * How a student has customised their robot. Stored per student in this
 * browser's localStorage (like display settings), so it never leaves the device.
 */
export interface RobotStyle {
  name: string;
  color: RobotColorId;
  background: RobotBackgroundId;
  /** Stage to show, or null to always show the newest unlocked stage. */
  stage: number | null;
}

/** The art is green; other colours are a CSS hue shift of it. */
export const ROBOT_COLORS = [
  { id: "green", label: "Green", hue: 0, swatch: "#1f9d4c" },
  { id: "blue", label: "Blue", hue: 90, swatch: "#1f6fd1" },
  { id: "purple", label: "Purple", hue: 150, swatch: "#7a3fd1" },
  { id: "pink", label: "Pink", hue: 200, swatch: "#d13f9a" },
  { id: "red", label: "Red", hue: 240, swatch: "#b8452f" },
  { id: "gold", label: "Gold", hue: 270, swatch: "#a8741c" },
] as const;
export type RobotColorId = (typeof ROBOT_COLORS)[number]["id"];

export const ROBOT_BACKGROUNDS = [
  { id: "mint", label: "Mint", css: "linear-gradient(160deg,#e6f6ec,#bfe8cf)" },
  { id: "sky", label: "Sky", css: "linear-gradient(160deg,#e3f0ff,#a9cdf5)" },
  { id: "sunset", label: "Sunset", css: "linear-gradient(160deg,#ffe7c7,#f7a6a6)" },
  { id: "space", label: "Space", css: "radial-gradient(circle at 30% 25%,#3b3f7a,#12142b 70%)" },
  { id: "grape", label: "Grape", css: "linear-gradient(160deg,#efe3ff,#c4a6f2)" },
  { id: "none", label: "None", css: "transparent" },
] as const;
export type RobotBackgroundId = (typeof ROBOT_BACKGROUNDS)[number]["id"];

export const NAME_MAX = 20;

export const DEFAULT_STYLE: RobotStyle = { name: "", color: "green", background: "mint", stage: null };

const keyFor = (studentId: string) => `cic-robot-${studentId}`;
const EVENT = "cic-robot-style";

/** Drop anything that isn't a known option, so a tampered value can't break the page. */
function clean(raw: unknown): RobotStyle {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<RobotStyle>;
  return {
    name: typeof r.name === "string" ? cleanName(r.name) : "",
    color: ROBOT_COLORS.some((c) => c.id === r.color) ? (r.color as RobotColorId) : DEFAULT_STYLE.color,
    background: ROBOT_BACKGROUNDS.some((b) => b.id === r.background) ? (r.background as RobotBackgroundId) : DEFAULT_STYLE.background,
    stage: typeof r.stage === "number" && Number.isInteger(r.stage) && r.stage >= 1 && r.stage <= 10 ? r.stage : null,
  };
}

export function cleanName(name: string): string {
  // Letters, numbers, spaces and a little punctuation only; no markup.
  return name.replace(/[^\p{L}\p{N} '\-_.!]/gu, "").slice(0, NAME_MAX);
}

const cache = new Map<string, { raw: string | null; style: RobotStyle }>();

export function loadRobotStyle(studentId: string): RobotStyle {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(keyFor(studentId));
  } catch {
    /* storage blocked */
  }
  const hit = cache.get(studentId);
  if (hit && hit.raw === raw) return hit.style;
  let style = DEFAULT_STYLE;
  try {
    style = raw ? clean(JSON.parse(raw)) : DEFAULT_STYLE;
  } catch {
    style = DEFAULT_STYLE;
  }
  cache.set(studentId, { raw, style });
  return style;
}

export function saveRobotStyle(studentId: string, style: RobotStyle) {
  const next = clean(style);
  try {
    localStorage.setItem(keyFor(studentId), JSON.stringify(next));
  } catch {
    cache.set(studentId, { raw: null, style: next }); // keep it for this visit
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Live robot style for a student; updates everywhere when it's saved. */
export function useRobotStyle(studentId: string): RobotStyle {
  return useSyncExternalStore(
    subscribe,
    () => loadRobotStyle(studentId),
    () => DEFAULT_STYLE,
  );
}

export function colorFilter(id: RobotColorId): string | undefined {
  const hue = ROBOT_COLORS.find((c) => c.id === id)?.hue ?? 0;
  return hue ? `hue-rotate(${hue}deg)` : undefined;
}

export function backgroundCss(id: RobotBackgroundId): string {
  return ROBOT_BACKGROUNDS.find((b) => b.id === id)?.css ?? "transparent";
}
