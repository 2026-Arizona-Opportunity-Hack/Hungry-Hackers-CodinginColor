/**
 * Avatar stages, XP thresholds, and shop catalog.
 *
 * Thresholds 0/60/150/280/450/660/920/1240/1630/2100 spread the ten robot
 * sprites across the course (~138 XP of base + bonus is a typical finish).
 * Everything here is static data: no network, no AI, no PII.
 */

export const XP_THRESHOLDS = [0, 60, 150, 280, 450, 660, 920, 1240, 1630, 2100] as const;

export interface AvatarStage {
  level: number;
  /** Short stage name shown under the robot. */
  title: string;
  /** One-line flavor shown on the evolution card. */
  tagline: string;
  /** What the robot says at this stage ({name} is replaced). */
  speech: string;
  /** Teaser for the NEXT stage ("" on the final stage). */
  nextTeaser: string;
}

export const STAGES: AvatarStage[] = [
  {
    level: 1,
    title: "Sprout Bot",
    tagline: "Just booted up and ready to learn.",
    speech: "Hi! I'm {name}. Every activity makes me grow — let's start together!",
    nextTeaser: "Reach 60 XP to grow arms and roll forward",
  },
  {
    level: 2,
    title: "Roller Buddy",
    tagline: "Found its wheels and can't stop moving.",
    speech: "Look — wheels! Keep earning XP and I'll keep growing with you.",
    nextTeaser: "Reach 150 XP to unlock my Pet Blob sidekick",
  },
  {
    level: 3,
    title: "Curious Crawler",
    tagline: "Asking questions about everything.",
    speech: "First tries earn bonus XP. Can you ace a check on try one?",
    nextTeaser: "Reach 280 XP for a sturdier frame and new colors",
  },
  {
    level: 4,
    title: "Puzzle Solver",
    tagline: "Loves a good challenge.",
    speech: "Modules give +20 XP when you finish the wrap-up. You've got this!",
    nextTeaser: "Reach 450 XP to stand tall with spring legs",
  },
  {
    level: 5,
    title: "Helper Bot",
    tagline: "Stands up straight and lends a hand.",
    speech: "Halfway to full power! I'm Cody's favorite shape, you know.",
    nextTeaser: "Reach 660 XP for rocket boots and a sunset backdrop",
  },
  {
    level: 6,
    title: "Rocket Runner",
    tagline: "Zooming through lessons at full speed.",
    speech: "Whee! Streak days earn +5 XP each. Come back tomorrow!",
    nextTeaser: "Reach 920 XP to evolve a super-brain",
  },
  {
    level: 7,
    title: "Brain Bot",
    tagline: "Thinking big thoughts about AI.",
    speech: "My brain is buzzing with everything you've learned so far.",
    nextTeaser: "Reach 1240 XP for a turbo core and night-sky backdrop",
  },
  {
    level: 8,
    title: "Turbo Thinker",
    tagline: "Glowing with knowledge.",
    speech: "Almost there! Finish strong — the final form is close.",
    nextTeaser: "Reach 1630 XP for golden wings",
  },
  {
    level: 9,
    title: "Sky Guardian",
    tagline: "Soaring above every challenge.",
    speech: "One more push! Complete the last modules to reach my final form.",
    nextTeaser: "Reach 2100 XP for the ultimate Golden Mind form",
  },
  {
    level: 10,
    title: "Golden Mind",
    tagline: "The ultimate learning companion.",
    speech: "We did it! Full evolution! You're an AI explorer now. Shiny!",
    nextTeaser: "",
  },
];

export interface ShopColor {
  id: string;
  label: string;
  swatch: string;
  unlockLevel: number;
}

export const SHOP_COLORS: ShopColor[] = [
  { id: "mint", label: "Mint", swatch: "#00A850", unlockLevel: 1 },
  { id: "sky", label: "Sky", swatch: "#005C99", unlockLevel: 2 },
  { id: "sunny", label: "Sunny", swatch: "#E8A100", unlockLevel: 3 },
  { id: "berry", label: "Berry", swatch: "#A63D8F", unlockLevel: 5 },
  { id: "ocean", label: "Ocean", swatch: "#006E6B", unlockLevel: 7 },
  { id: "gold", label: "Gold", swatch: "#8A6D00", unlockLevel: 9 },
];

export interface ShopBackdrop {
  id: string;
  label: string;
  /** Tailwind gradient classes for the stage behind the sprite. */
  classes: string;
  unlockLevel: number;
}

export const SHOP_BACKDROPS: ShopBackdrop[] = [
  { id: "meadow", label: "Meadow", classes: "from-cic-tint to-white", unlockLevel: 1 },
  { id: "sky", label: "Morning sky", classes: "from-sky-100 to-white", unlockLevel: 3 },
  { id: "sunset", label: "Sunset", classes: "from-amber-100 to-rose-100", unlockLevel: 5 },
  { id: "night", label: "Night sky", classes: "from-slate-800 to-slate-600", unlockLevel: 7 },
  { id: "gold", label: "Champion gold", classes: "from-yellow-100 to-amber-200", unlockLevel: 10 },
];

export interface ShopPet {
  id: string;
  label: string;
  emoji: string;
  unlockLevel: number;
}

export const SHOP_PETS: ShopPet[] = [
  { id: "none", label: "No pet", emoji: "", unlockLevel: 1 },
  { id: "blob", label: "Blob", emoji: "🟢", unlockLevel: 2 },
  { id: "chick", label: "Pip", emoji: "🐥", unlockLevel: 4 },
  { id: "fox", label: "Fenn", emoji: "🦊", unlockLevel: 6 },
  { id: "dragon", label: "Draco", emoji: "🐲", unlockLevel: 8 },
  { id: "star", label: "Nova", emoji: "🌟", unlockLevel: 10 },
];
