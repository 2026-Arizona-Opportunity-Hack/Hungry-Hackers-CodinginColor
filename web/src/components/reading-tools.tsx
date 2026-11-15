"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Eraser, Highlighter, Pause, Play, ScanText, X } from "lucide-react";
import { loadPrefs } from "@/lib/display-prefs";
import { cx } from "./ui";

/**
 * Reading helpers for lesson activities:
 *  - Highlighter: tap words to mark them in yellow.
 *  - Read word by word: one word at a time is lit up, stepped by hand or played.
 *
 * Nothing here is saved anywhere. Highlights live only on screen and vanish when
 * the student moves to another activity. Text only becomes clickable word-by-word
 * while a tool is in use, so the page stays normal for everyone else.
 */

interface ReadingState {
  highlighter: boolean;
  reading: boolean;
  clearToken: number;
}

const ReadingContext = createContext<ReadingState | null>(null);

const HL_EVENT = "cic-toggle-highlight";
const SPEEDS = { slow: 900, medium: 600, fast: 380 } as const;
type Speed = keyof typeof SPEEDS;

export function ReadingTools({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  const [highlighter, setHighlighter] = useState(false);
  const [reading, setReading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>("medium");
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [clearToken, setClearToken] = useState(0);
  // Word spans would break Google's page translation, so the tools are English-only.
  const [translated, setTranslated] = useState(false);
  const area = useRef<HTMLDivElement>(null);
  const currentEl = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setTranslated(loadPrefs().lang !== "en");
  }, []);

  const words = useCallback(() => Array.from(area.current?.querySelectorAll<HTMLElement>("[data-word]") ?? []), []);

  // Light up the current word and keep it in view.
  useEffect(() => {
    currentEl.current?.removeAttribute("data-reading");
    currentEl.current = null;
    if (!reading) return;
    const list = words();
    setCount(list.length);
    const el = list[Math.min(index, list.length - 1)];
    if (!el) return;
    el.setAttribute("data-reading", "");
    currentEl.current = el;
    const calm = document.documentElement.dataset.motion === "reduce" || matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "nearest", behavior: calm ? "auto" : "smooth" });
  }, [reading, index, words]);

  // When the text changes under us (next slide, new hint), recount; if our word is gone, start over.
  useEffect(() => {
    if (!reading || !area.current) return;
    const obs = new MutationObserver(() => {
      setCount(words().length);
      if (currentEl.current && !currentEl.current.isConnected) {
        currentEl.current = null;
        setIndex(0);
        setPlaying(false);
      }
    });
    obs.observe(area.current, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [reading, words]);

  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => {
      setIndex((i) => {
        if (i + 1 >= words().length) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, SPEEDS[speed]);
    return () => window.clearInterval(t);
  }, [playing, speed, words]);

  if (!enabled || translated) return <>{children}</>;

  const step = (d: number) => {
    setPlaying(false);
    setIndex((i) => Math.max(0, Math.min(count - 1, i + d)));
  };
  const toggleCurrent = () => currentEl.current?.dispatchEvent(new CustomEvent(HL_EVENT, { bubbles: true }));
  const btn =
    "inline-flex min-h-11 items-center gap-1.5 rounded-xl border-2 px-3 text-sm font-bold transition-colors disabled:opacity-50";
  const off = "border-cic-line bg-white text-cic-darker hover:bg-cic-tint";
  const on = "border-cic-dark bg-cic-dark text-white";

  return (
    <ReadingContext.Provider value={{ highlighter, reading, clearToken }}>
      <div
        role="toolbar"
        aria-label="Reading tools"
        className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border-2 border-cic-line bg-cic-tint/60 p-2 print:hidden"
        onKeyDown={(e) => {
          // Leave the arrow keys to the speed menu when it has focus.
          if (!reading || (e.target as HTMLElement).tagName === "SELECT") return;
          if (e.key === "ArrowRight") step(1);
          else if (e.key === "ArrowLeft") step(-1);
          else return;
          e.preventDefault();
        }}
      >
        <button type="button" aria-pressed={highlighter} onClick={() => setHighlighter((h) => !h)} className={cx(btn, highlighter ? on : off)}>
          <Highlighter aria-hidden className="size-4" /> Highlighter
        </button>
        <button
          type="button"
          aria-pressed={reading}
          onClick={() => {
            setReading((r) => !r);
            setPlaying(false);
            setIndex(0);
          }}
          className={cx(btn, reading ? on : off)}
        >
          <ScanText aria-hidden className="size-4" /> Read word by word
        </button>
        {(highlighter || reading) && (
          <button type="button" onClick={() => setClearToken((t) => t + 1)} className={cx(btn, off)}>
            <Eraser aria-hidden className="size-4" /> Clear highlights
          </button>
        )}

        {reading && (
          <div className="flex w-full flex-wrap items-center gap-2 border-t-2 border-cic-line pt-2">
            <button type="button" onClick={() => step(-1)} disabled={index === 0} className={cx(btn, off)}>
              <ChevronLeft aria-hidden className="size-4" /> Back
            </button>
            <button type="button" onClick={() => setPlaying((p) => !p)} className={cx(btn, off)}>
              {playing ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
              {playing ? "Pause" : "Play"}
            </button>
            <button type="button" onClick={() => step(1)} disabled={index >= count - 1} className={cx(btn, off)}>
              Next <ChevronRight aria-hidden className="size-4" />
            </button>
            <button type="button" onClick={toggleCurrent} className={cx(btn, off)}>
              <Highlighter aria-hidden className="size-4" /> Highlight this word
            </button>
            <label className="inline-flex items-center gap-1.5 text-sm font-bold text-cic-darker">
              Speed
              <select
                value={speed}
                onChange={(e) => setSpeed(e.target.value as Speed)}
                className="min-h-11 rounded-xl border-2 border-cic-line bg-white px-2 text-black"
              >
                <option value="slow">Slow</option>
                <option value="medium">Medium</option>
                <option value="fast">Fast</option>
              </select>
            </label>
            <span className="text-sm font-bold text-cic-muted" aria-live="off">
              Word {count ? Math.min(index, count - 1) + 1 : 0} of {count}
            </span>
            <button
              type="button"
              onClick={() => {
                setReading(false);
                setPlaying(false);
              }}
              className={cx(btn, off, "ml-auto")}
            >
              <X aria-hidden className="size-4" /> Stop
            </button>
          </div>
        )}
        {highlighter && (
          <p className="w-full px-1 text-sm text-cic-darker">Tap words to highlight them. Tap again to remove. Highlights aren&apos;t saved.</p>
        )}
        {reading && !highlighter && (
          <p className="w-full px-1 text-sm text-cic-darker">Use Next and Back, or the arrow keys while a tool button is focused.</p>
        )}
      </div>
      <div ref={area} className={cx(highlighter && "hl-mode")}>
        {children}
      </div>
    </ReadingContext.Provider>
  );
}

/**
 * Text the reading tools can work on. Renders plain text until a tool is used,
 * then splits into word spans the highlighter and reader can mark.
 */
export function ReadableText({ text }: { text: string }) {
  const ctx = useContext(ReadingContext);
  const [marks, setMarks] = useState<ReadonlySet<number>>(() => new Set());
  const wrap = useRef<HTMLSpanElement>(null);

  const toggle = useCallback((i: number) => {
    setMarks((m) => {
      const next = new Set(m);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }, []);

  // Clear when asked.
  const clearToken = ctx?.clearToken ?? 0;
  useEffect(() => {
    setMarks(new Set());
  }, [clearToken]);

  // "Highlight this word" from the reader toolbar.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const onToggle = (e: Event) => {
      const i = Number((e.target as HTMLElement).dataset.word);
      if (Number.isInteger(i)) toggle(i);
    };
    el.addEventListener(HL_EVENT, onToggle);
    return () => el.removeEventListener(HL_EVENT, onToggle);
  }, [toggle]);

  const split = ctx && (ctx.highlighter || ctx.reading || marks.size > 0);
  if (!split) return <span ref={wrap}>{text}</span>;

  let w = 0;
  return (
    <span ref={wrap}>
      {text.split(/(\s+)/).map((part, pi) => {
        if (!part || /^\s+$/.test(part)) return part;
        const i = w++;
        return (
          <span
            key={pi}
            data-word={i}
            data-hl={marks.has(i) ? "" : undefined}
            onClick={
              ctx.highlighter
                ? (e) => {
                    // Inside an answer choice, a highlight tap must not pick the answer.
                    e.preventDefault();
                    e.stopPropagation();
                    toggle(i);
                  }
                : undefined
            }
          >
            {part}
          </span>
        );
      })}
    </span>
  );
}
