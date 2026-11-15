"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Languages, Settings2, X } from "lucide-react";
import { DEFAULT_PREFS, applyPrefs, loadPrefs, savePrefs, type DisplayPrefs, type TextSize, type ThemePref } from "@/lib/display-prefs";
import { LANGUAGES, isLanguage, setTranslateCookie } from "@/lib/translate";
import { cx } from "./ui";

const THEMES: { value: ThemePref; label: string }[] = [
  { value: "system", label: "Match device" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const SIZES: { value: TextSize; label: string; sample: string }[] = [
  { value: "md", label: "Default", sample: "text-base" },
  { value: "lg", label: "Large", sample: "text-lg" },
  { value: "xl", label: "Larger", sample: "text-xl" },
  { value: "xxl", label: "Largest", sample: "text-2xl" },
];

const TOGGLES: { key: "readableFont" | "wideSpacing" | "reduceMotion"; label: string; hint: string }[] = [
  { key: "readableFont", label: "Easy-read font", hint: "Lexend, a font made to be easier to read, including for dyslexic readers." },
  { key: "wideSpacing", label: "Extra text spacing", hint: "More room between letters, words and lines." },
  { key: "reduceMotion", label: "Reduce motion", hint: "Turns off animations and confetti." },
];

const optionClass =
  "flex min-h-12 cursor-pointer items-center justify-center rounded-xl border-2 border-cic-line px-2 text-center font-bold has-[:checked]:border-cic-dark has-[:checked]:bg-cic-dark has-[:checked]:text-white has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-cic-dark";

/**
 * Floating "Display" button on every page. Opens a small panel of native radio
 * groups and checkboxes, so it works with keyboard and screen readers as-is.
 */
export function DisplaySettings() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<DisplayPrefs>(DEFAULT_PREFS);
  const panelId = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => setPrefs(loadPrefs()), []);

  // "Match device" follows the OS live if it switches while the page is open.
  useEffect(() => {
    if (prefs.theme !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyPrefs(prefs);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [prefs]);

  useEffect(() => {
    if (!open) return;
    heading.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const update = (patch: Partial<DisplayPrefs>) => {
    const next = { ...prefs, ...patch };
    if (!isLanguage(next.lang)) next.lang = "en";
    setPrefs(next);
    applyPrefs(next);
    savePrefs(next);
    // The translator takes over the page text, so a language change reloads it.
    if (next.lang !== prefs.lang) {
      setTranslateCookie(next.lang);
      location.reload();
    }
  };

  return (
    // Sits above the mobile bottom nav (h-14) and clear of it on desktop.
    <div ref={wrap} className="fixed bottom-20 left-3 z-40 md:bottom-4 md:left-4">
      {open && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={`${panelId}-title`}
          className="absolute bottom-full left-0 mb-3 max-h-[calc(100dvh-8rem)] w-[min(22rem,calc(100vw-1.5rem))] overflow-y-auto rounded-[var(--radius-card)] border-2 border-cic-line bg-white p-4 text-black shadow-slab-gray"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 id={`${panelId}-title`} ref={heading} tabIndex={-1} className="font-display text-xl text-cic-dark">
              Display settings
            </h2>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                button.current?.focus();
              }}
              className="grid size-11 place-items-center rounded-xl text-cic-dark hover:bg-cic-tint"
            >
              <X aria-hidden className="size-5" />
              <span className="sr-only">Close display settings</span>
            </button>
          </div>

          <div className="mb-4">
            <label htmlFor={`${panelId}-lang`} className="mb-2 flex items-center gap-2 font-bold">
              <Languages aria-hidden className="size-5" />
              Language
            </label>
            {/* Language names stay in their own language (translate="no") so people can find theirs. */}
            <select
              id={`${panelId}-lang`}
              translate="no"
              value={prefs.lang}
              onChange={(e) => update({ lang: e.target.value })}
              className="notranslate min-h-12 w-full rounded-xl border-2 border-cic-line bg-white px-3 font-bold text-black"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-cic-muted">Translates the whole site. The page text is sent to Google Translate once you pick a language other than English.</p>
          </div>

          <fieldset className="mb-4">
            <legend className="mb-2 font-bold">Theme</legend>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((t) => (
                <label key={t.value} className={cx(optionClass, "text-sm")}>
                  <input
                    type="radio"
                    name={`${panelId}-theme`}
                    value={t.value}
                    checked={prefs.theme === t.value}
                    onChange={() => update({ theme: t.value })}
                    className="sr-only"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mb-4">
            <legend className="mb-2 font-bold">Text size</legend>
            <div className="grid grid-cols-4 gap-2">
              {SIZES.map((s) => (
                <label key={s.value} className={optionClass}>
                  <input
                    type="radio"
                    name={`${panelId}-text`}
                    value={s.value}
                    checked={prefs.text === s.value}
                    onChange={() => update({ text: s.value })}
                    className="sr-only"
                  />
                  <span aria-hidden className={s.sample}>
                    A
                  </span>
                  <span className="sr-only">{s.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="mb-2 font-bold">Reading</legend>
            {TOGGLES.map((t) => (
              <label
                key={t.key}
                className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-cic-line p-3 has-[:checked]:border-cic-dark has-[:checked]:bg-cic-tint has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-cic-dark"
              >
                <input
                  type="checkbox"
                  checked={prefs[t.key]}
                  onChange={(e) => update({ [t.key]: e.target.checked })}
                  className="mt-1 size-5 shrink-0 accent-[var(--color-cic-dark)]"
                />
                <span>
                  <span className="block font-bold">{t.label}</span>
                  <span className="block text-sm text-cic-muted">{t.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <button
            type="button"
            onClick={() => update(DEFAULT_PREFS)}
            className="mt-4 min-h-11 w-full rounded-xl text-sm font-bold text-cic-dark underline hover:bg-cic-tint"
          >
            Reset to defaults
          </button>
        </div>
      )}

      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-12 items-center gap-2 rounded-2xl border-2 border-cic-line bg-white px-4 font-bold text-cic-dark shadow-slab-gray hover:bg-cic-tint"
      >
        <Settings2 aria-hidden className="size-5" />
        <span>Display</span>
      </button>
    </div>
  );
}
