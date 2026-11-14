import type { PictureCode } from "./types";

/** Nine friendly pictures. Students tap three, in order, to prove who they are. */
export const PICTURES: { emoji: string; name: string }[] = [
  { emoji: "🐶", name: "dog" },
  { emoji: "🐱", name: "cat" },
  { emoji: "🦊", name: "fox" },
  { emoji: "🐼", name: "panda" },
  { emoji: "🐸", name: "frog" },
  { emoji: "🦁", name: "lion" },
  { emoji: "🐙", name: "octopus" },
  { emoji: "🐢", name: "turtle" },
  { emoji: "🦉", name: "owl" },
];

export function pictureName(emoji: string): string {
  return PICTURES.find((p) => p.emoji === emoji)?.name ?? emoji;
}

/** Deterministic picture code from a seed number (used for demo data and new rosters). */
export function pictureCodeFor(seed: number): PictureCode {
  const a = PICTURES[seed % 9].emoji;
  const b = PICTURES[(seed * 7 + 3) % 9].emoji;
  const c = PICTURES[(seed * 5 + 1) % 9].emoji;
  return [a, b, c];
}

export function randomPictureCode(): PictureCode {
  const pick = () => PICTURES[Math.floor(Math.random() * PICTURES.length)].emoji;
  return [pick(), pick(), pick()];
}

export function sameCode(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}
