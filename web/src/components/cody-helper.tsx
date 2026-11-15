"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircleQuestion, Send, X } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Button, Loading, cx } from "@/components/ui";
import { ASSISTANT_CHIPS, askAssistant } from "@/lib/assistant";
import { useTeacherClass } from "@/lib/use-teacher";
import { studentStatus } from "@/lib/analytics";

interface Msg {
  role: "user" | "cody";
  text: string;
}

const HIDE_KEY = "cic.cody.hidden.v1";
const STOP_KEY = "cic.cody.stop.v1";

/**
 * Cody: static level-5 sprite helper, bottom-right on every teacher page
 * (mounted in the teach layout so it persists across routes). Passive bubble
 * teases ("Psst — 2 students need help?"), never steals focus; the 380x520
 * chat panel is a focus-trapped dialog with Esc to close.
 */
export function CodyHelper() {
  const { ctx } = useTeacherClass();
  const [open, setOpen] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [dismissedTwice, setDismissedTwice] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const invokerRef = useRef<HTMLElement | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const flagged = ctx
    ? ctx.cls.roster.filter((s) => studentStatus(ctx.progress[s.id], ctx.modules).status === "stuck").length
    : 0;

  // Passive Need-help bubble: first after 8s, then every 60-120s jitter, 7s
  // visible each. Session stops after two dismissals or on sign-out (state
  // lives in memory, so signing out resets it).
  useEffect(() => {
    let stopped = false;
    try {
      stopped = window.sessionStorage.getItem(STOP_KEY) === "1" || window.localStorage.getItem(HIDE_KEY) === "1";
    } catch {
      /* storage blocked */
    }
    if (stopped) {
      setDismissedTwice(true);
      return;
    }
    let dismisses = 0;
    const show = () => {
      if (dismisses >= 2 || open) {
        schedule();
        return;
      }
      setBubble(
        flagged > 0
          ? `Psst — ${flagged} student${flagged === 1 ? "" : "s"} might need help. Want a hand?`
          : "Psst — all clear! Nobody looks stuck. Want teaching tips?",
      );
      timers.current.push(
        window.setTimeout(() => {
          setBubble((b) => {
            void b;
            return null;
          });
          schedule();
        }, 7000),
      );
    };
    const schedule = () => {
      timers.current.push(window.setTimeout(show, 60_000 + Math.random() * 60_000));
    };
    timers.current.push(window.setTimeout(show, 8000));
    const onDismiss = () => {
      dismisses++;
      if (dismisses >= 2) {
        try {
          window.sessionStorage.setItem(STOP_KEY, "1");
        } catch {
          /* ignore */
        }
        setDismissedTwice(true);
      }
    };
    window.addEventListener("cody-dismiss", onDismiss);
    return () => {
      window.removeEventListener("cody-dismiss", onDismiss);
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    // flagged/open read live via refs at fire time; effect runs once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Focus trap + Esc while the panel is open.
  useEffect(() => {
    if (!open) return;
    invokerRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        return;
      }
      if (e.key === "Tab") {
        const root = document.getElementById("cody-panel");
        if (!root) return;
        const items = [...root.querySelectorAll<HTMLElement>("button, input, [tabindex]:not([tabindex='-1'])")].filter(
          (el) => !el.hasAttribute("disabled"),
        );
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      invokerRef.current?.focus?.();
    };
  }, [open ]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [msgs, thinking, open]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || thinking) return;
    setInput("");
    const next = [...msgs, { role: "user" as const, text: clean }];
    setMsgs(next);
    setThinking(true);
    const reply = await askAssistant(clean, {
      route: "teach",
      flaggedCount: flagged,
      className: ctx?.cls.name ?? "your class",
    });
    setMsgs([...next, { role: "cody", text: reply }]);
    setThinking(false);
  }

  function dismissBubble() {
    setBubble(null);
    window.dispatchEvent(new Event("cody-dismiss"));
  }

  if (dismissedTwice && !open && !bubble) {
    // Fully quiet: just the sprite button, no more popups this session.
  }

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2 print:hidden">
      {bubble && !open && (
        <div role="status" aria-live="polite" className="pointer-events-auto relative max-w-64 animate-pop rounded-2xl rounded-br-md border-2 border-cic-dark bg-white p-3 pr-8 text-sm font-bold text-cic-darker shadow-slab">
          {bubble}
          <button
            type="button"
            onClick={dismissBubble}
            aria-label="Dismiss Cody's message"
            className="absolute top-1 right-1 grid size-6 place-items-center rounded-full text-cic-muted hover:bg-cic-tint hover:text-cic-darker"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
      )}

      {open && (
        <div
          id="cody-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cody-title"
          className="pointer-events-auto flex h-[520px] w-[min(380px,calc(100vw-2rem))] animate-pop flex-col overflow-hidden rounded-3xl border-2 border-cic-dark bg-white shadow-slab"
        >
          <div className="flex items-center gap-2 border-b-2 border-cic-line bg-cic-tint p-3">
            <Avatar level={5} size={44} className="h-11 w-11" />
            <div className="min-w-0 flex-1">
              <h2 id="cody-title" className="font-display text-lg leading-tight text-cic-dark">
                Cody
              </h2>
              <p className="truncate text-xs font-bold text-cic-muted">Classroom helper · mock brain, no AI calls</p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close Cody chat"
              className="grid size-9 place-items-center rounded-xl font-black text-cic-dark hover:bg-white"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>

          <div ref={logRef} role="log" aria-live="polite" aria-label="Chat with Cody" className="flex-1 space-y-2 overflow-y-auto p-3">
            {msgs.length === 0 && (
              <div className="rounded-2xl bg-cic-tint p-3 text-sm font-bold text-cic-darker">
                Hi, I&apos;m Cody! Ask me who needs help, how XP works, or how students join.
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={cx("max-w-[85%] rounded-2xl p-2.5 text-sm", m.role === "user" ? "ml-auto bg-cic-dark font-bold text-white" : "bg-cic-tint font-bold text-cic-darker")}>
                {m.text}
              </div>
            ))}
            {thinking && (
              <div className="flex items-center gap-1 rounded-2xl bg-cic-tint p-2.5 text-sm font-bold text-cic-muted">
                <Loading inline size="sm" label="Cody is thinking" />
              </div>
            )}
          </div>

          <div className="space-y-2 border-t-2 border-cic-line p-3">
            <div className="flex flex-wrap gap-1.5">
              {ASSISTANT_CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => void send(c)}
                  disabled={thinking}
                  className="min-h-9 rounded-full border-2 border-cic-line px-2.5 text-xs font-bold text-cic-dark hover:bg-cic-tint disabled:opacity-50"
                >
                  {c}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <label htmlFor="cody-input" className="sr-only">
                Ask Cody
              </label>
              <input
                id="cody-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Cody…"
                className="min-h-11 min-w-0 flex-1 rounded-xl border-2 border-cic-line px-3 text-sm font-bold focus:border-cic-dark"
              />
              <Button type="submit" disabled={!input.trim() || thinking} aria-label="Send message">
                <Send aria-hidden className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => {
            setBubble(null);
            setOpen(true);
          }}
          aria-label={flagged > 0 ? `Open Cody chat, ${flagged} students may need help` : "Open Cody chat"}
          aria-haspopup="dialog"
          className="pointer-events-auto group relative min-h-11 rounded-full border-2 border-cic-dark bg-white p-1 pr-4 shadow-slab transition-transform hover:-translate-y-0.5"
        >
          <span className="flex items-center gap-2">
            <Avatar level={5} size={48} className="h-12 w-12 animate-avatar-bob" />
            <span className="flex items-center gap-1 text-sm font-black text-cic-dark">
              <MessageCircleQuestion aria-hidden className="size-4" /> Cody
            </span>
          </span>
          {flagged > 0 && (
            <span aria-hidden className="absolute -top-1 -right-1 grid size-6 place-items-center rounded-full bg-cic-danger text-xs font-black text-white">
              {flagged}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
