/**
 * Deterministic robot names. No free text (child safety): students only pick
 * from generated options. Names derive from the student id (FNV-1a + mulberry32)
 * so they are stable per student, and unique within a class roster.
 */

const FIRST = [
  "Bolt", "Pixel", "Sprocket", "Nibble", "Ziggy", "Circuit", "Bleep", "Gizmo",
  "Sparky", "Widget", "Turbo", "Dot", "Beep", "Clank", "Dizzy", "Echo",
  "Fizz", "Glimmer", "Hopper", "Ion", "Jolt", "Kernel", "Looper", "Mochi",
  "Nudge", "Orbit", "Pip", "Quark", "Rusty", "Sunny",
];

const SECOND = [
  "Byte", "Sprout", "Whirr", "Cog", "Doodle", "Flux", "Gadget", "Halo",
  "Widget", "Jelly", "Kite", "Lens", "Magnet", "Noodle", "Ozone", "Pogo",
  "Quant", "Radar", "Socket", "Tinker", "Unit", "Volt", "Whisk", "Xenon",
  "Yoyo", "Zip", "Bolt", "Chip", "Dash", "Puff",
];

function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `n` deterministic name options for a student id (default 3). */
export function generateNameOptions(studentId: string, n = 3): string[] {
  const rand = mulberry32(fnv1a(`cic-avatar:${studentId}`));
  const out: string[] = [];
  const guard = new Set<string>();
  for (let k = 0; out.length < n && k < n * 20; k++) {
    const name = `${FIRST[Math.floor(rand() * FIRST.length)]} ${SECOND[Math.floor(rand() * SECOND.length)]}`;
    if (guard.has(name)) continue;
    guard.add(name);
    out.push(name);
  }
  return out;
}

/**
 * First generated option that isn't taken by a classmate, with a numbered
 * fallback if the whole option set collides (e.g. huge rosters).
 */
export function resolveUniqueName(studentId: string, taken: Set<string>): string {
  for (const name of generateNameOptions(studentId, 3)) {
    if (!taken.has(name)) return name;
  }
  let i = 2;
  for (;;) {
    const base = generateNameOptions(studentId, 1)[0];
    const name = `${base} ${i}`;
    if (!taken.has(name)) return name;
    i++;
  }
}
