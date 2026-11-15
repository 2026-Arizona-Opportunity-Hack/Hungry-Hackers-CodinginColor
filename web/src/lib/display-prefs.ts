/**
 * Display preferences (theme, text size, easy-read font, spacing, motion).
 * Stored per device in localStorage and applied as data-* attributes on <html>,
 * which globals.css reads. PREFS_SCRIPT runs before first paint so there's no
 * flash of the wrong theme or size.
 */
export type ThemePref = "system" | "light" | "dark";
export type TextSize = "md" | "lg" | "xl" | "xxl";

export interface DisplayPrefs {
  theme: ThemePref;
  text: TextSize;
  readableFont: boolean;
  wideSpacing: boolean;
  reduceMotion: boolean;
  /** Site language (see lib/translate.ts). "en" = no translation. */
  lang: string;
}

export const DEFAULT_PREFS: DisplayPrefs = {
  theme: "system",
  text: "md",
  readableFont: false,
  wideSpacing: false,
  reduceMotion: false,
  lang: "en",
};

export const PREFS_KEY = "cic-display-prefs";

export function loadPrefs(): DisplayPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(p: DisplayPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* private mode or storage blocked: settings still apply for this visit */
  }
}

export function applyPrefs(p: DisplayPrefs) {
  const root = document.documentElement;
  const dark = p.theme === "dark" || (p.theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  root.dataset.theme = dark ? "dark" : "light";
  root.dataset.text = p.text;
  root.dataset.font = p.readableFont ? "readable" : "default";
  root.dataset.spacing = p.wideSpacing ? "wide" : "normal";
  root.dataset.motion = p.reduceMotion ? "reduce" : "auto";
}

/** Inline, pre-hydration copy of loadPrefs + applyPrefs. Keep the two in sync. */
export const PREFS_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(PREFS_KEY)})||"{}");var r=document.documentElement;var t=p.theme||"system";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);r.dataset.theme=d?"dark":"light";r.dataset.text=p.text||"md";r.dataset.font=p.readableFont?"readable":"default";r.dataset.spacing=p.wideSpacing?"wide":"normal";r.dataset.motion=p.reduceMotion?"reduce":"auto";}catch(e){}})();`;
