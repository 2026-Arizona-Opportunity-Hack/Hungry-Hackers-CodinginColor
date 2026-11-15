"use client";

import { useEffect, useId, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, Flag, Lightbulb, XCircle } from "lucide-react";
import { ReadableText } from "./reading-tools";
import { Button, cx } from "./ui";
import type { Activity, ChoiceQuestion } from "@/lib/types";

export interface Completion {
  score?: number;
  attempts: number;
  response?: unknown;
}

export interface ActivityProps<K extends Activity["kind"]> {
  activity: Extract<Activity, { kind: K }>;
  onComplete: (c: Completion) => void;
  onFailedCheck?: () => void;
}

// ---------- Slides ----------

export function SlidesActivity({ activity, onComplete }: ActivityProps<"slides">) {
  const [i, setI] = useState(0);
  const slide = activity.slides[i];
  const last = i === activity.slides.length - 1;
  return (
    <div>
      <div
        key={i}
        aria-roledescription="slide"
        aria-label={`Slide ${i + 1} of ${activity.slides.length}`}
        className={cx(
          "flex min-h-72 animate-rise flex-col justify-center rounded-[24px] border-2 border-cic-line bg-white p-6 shadow-slab-gray md:min-h-80 md:p-10",
          slide.divider && "items-center text-center",
        )}
      >
        <h2 className={cx("font-display leading-tight", slide.divider ? "text-3xl md:text-5xl" : "text-2xl text-cic-dark md:text-3xl")}>
          <ReadableText text={slide.title} />
        </h2>
        {slide.bullets.length > 0 && (
          <ul className={cx("mt-4 space-y-2 text-lg", !slide.divider && "list-disc pl-6")}>
            {slide.bullets.map((b) => (
              <li key={b}>
                <ReadableText text={b} />
              </li>
            ))}
          </ul>
        )}
        {slide.ourProject && (
          <div className="mt-5 rounded-xl border border-cic-line bg-cic-tint p-4">
            <p className="font-mono text-sm font-bold text-cic-darker">Our project:</p>
            <p className="mt-1">
              <ReadableText text={slide.ourProject} />
            </p>
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => setI((x) => x - 1)} disabled={i === 0}>
          <ArrowLeft aria-hidden className="size-5" /> Back
        </Button>
        <p aria-live="polite" className="text-sm font-bold text-cic-muted">
          {i + 1} / {activity.slides.length}
        </p>
        {last ? (
          <Button onClick={() => onComplete({ attempts: 1 })}>
            I&apos;m done reading <CheckCircle2 aria-hidden className="size-5" />
          </Button>
        ) : (
          <Button onClick={() => setI((x) => x + 1)}>
            Next <ArrowRight aria-hidden className="size-5" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------- Shared question UI ----------

function QuestionCard({
  q,
  index,
  value,
  onChange,
  disabled,
  reveal,
  markWrong,
  flagged,
  onToggleFlag,
}: {
  q: ChoiceQuestion;
  index: number;
  value: number | undefined;
  onChange: (v: number) => void;
  disabled?: boolean;
  /** Show which answer is right (and which pick was wrong). */
  reveal?: boolean;
  /** Mark the picked answer as wrong WITHOUT revealing the right one (a hint is shown instead). */
  markWrong?: boolean;
  /** Warm-up and wrap-up only: the student flagged this question to come back to. */
  flagged?: boolean;
  onToggleFlag?: () => void;
}) {
  const name = useId();
  return (
    <fieldset
      id={`question-${q.id}`}
      className={cx(
        "scroll-mt-24 rounded-[var(--radius-card)] border-2 bg-white p-5 shadow-slab-gray",
        flagged ? "border-cic-warn" : "border-cic-line",
      )}
    >
      <legend className="px-1 text-lg font-bold">
        {index + 1}. <ReadableText text={q.prompt} />
      </legend>
      {onToggleFlag && (
        <div className="mb-1 flex justify-end">
          <button
            type="button"
            aria-pressed={Boolean(flagged)}
            onClick={onToggleFlag}
            className={cx(
              "inline-flex min-h-11 items-center gap-1.5 rounded-xl border-2 px-3 text-sm font-bold transition-colors",
              flagged ? "border-cic-warn bg-cic-warn-bg text-cic-warn" : "border-cic-line bg-white text-cic-muted hover:bg-cic-tint",
            )}
          >
            <Flag aria-hidden className={cx("size-4", flagged && "fill-current")} />
            {flagged ? "Marked for review" : "Mark for review"}
            <span className="sr-only"> (question {index + 1})</span>
          </button>
        </div>
      )}
      {q.code && <pre translate="no" className="mt-2 overflow-x-auto rounded-xl bg-cic-tint p-4 font-mono">{q.code}</pre>}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {q.choices.map((c, ci) => {
          const checked = value === ci;
          const correct = reveal && ci === q.answerIndex;
          const wrong = (reveal || markWrong) && checked && ci !== q.answerIndex;
          return (
            <label
              key={c}
              className={cx(
                "flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border-2 px-3 py-2 font-bold transition-[transform,box-shadow,background-color] duration-100",
                "has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-cic-dark",
                correct
                  ? "animate-pop border-cic-dark bg-cic-tint shadow-slab"
                  : wrong
                    ? "animate-shake border-cic-danger bg-cic-danger-bg shadow-[0_4px_0_var(--color-cic-danger)]"
                    : checked
                      ? "translate-y-[2px] border-cic-dark bg-cic-tint shadow-[0_2px_0_var(--color-cic-dark)]"
                      : "border-cic-line bg-white shadow-slab-gray hover:bg-cic-tint",
                disabled && "cursor-default",
              )}
            >
              <input
                type="radio"
                name={name}
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(ci)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cx(
                  "grid size-10 shrink-0 place-items-center rounded-xl font-display",
                  checked || correct ? "bg-cic-dark text-white" : "bg-cic-tint text-cic-dark",
                )}
              >
                {"ABCDEF"[ci]}
              </span>
              <span className="flex-1">
                <ReadableText text={c} />
              </span>
              {correct && (
                <span className="inline-flex items-center gap-1 text-sm font-bold text-cic-darker">
                  <CheckCircle2 aria-hidden className="size-4" /> Correct answer
                </span>
              )}
              {wrong && (
                <span className="inline-flex items-center gap-1 text-sm font-bold text-cic-danger">
                  <XCircle aria-hidden className="size-4" /> Your answer
                </span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

// ---------- Pretest / post-test ----------

/** After this many wrong tries on one question, show the right answer so nobody gets stuck. */
const REVEAL_AFTER = 3;

export function QuizActivity({ activity, onComplete }: ActivityProps<"pretest" | "posttest">) {
  const qs = activity.questions;
  const isPre = activity.kind === "pretest";
  const [answers, setAnswers] = useState<(number | undefined)[]>(() => qs.map(() => undefined));
  /** The answers from the very first submit. They decide the score, whatever happens on retries. */
  const [first, setFirst] = useState<(number | undefined)[] | null>(null);
  const [tries, setTries] = useState<number[]>(() => qs.map(() => 0));
  const [wrongNow, setWrongNow] = useState<boolean[]>(() => qs.map(() => false));
  const [locked, setLocked] = useState<boolean[]>(() => qs.map(() => false));
  /** "Mark for review" flags. On-screen help only: never saved, and cleared on submit. */
  const [flagged, setFlagged] = useState<boolean[]>(() => qs.map(() => false));
  const all = answers.every((a) => a !== undefined);
  const firstScore = first ? first.filter((a, i) => a === qs[i].answerIndex).length / qs.length : 0;
  const finished = first !== null && locked.every(Boolean);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!all) return;
    setFlagged(qs.map(() => false));
    // Warm-up: no feedback at all. It measures what students knew before the lesson.
    if (isPre) {
      const score = answers.filter((a, i) => a === qs[i].answerIndex).length / qs.length;
      return onComplete({ attempts: 1, score, response: answers });
    }
    // Wrap-up: a wrong answer gets a hint and a retry, but the FIRST try is what counts.
    if (!first) setFirst([...answers]);
    const nextTries = [...tries];
    const nextWrong = [...wrongNow];
    const nextLocked = [...locked];
    qs.forEach((q, i) => {
      if (locked[i]) return;
      if (answers[i] === q.answerIndex) {
        nextLocked[i] = true;
        nextWrong[i] = false;
      } else {
        nextTries[i] += 1;
        nextWrong[i] = true;
        if (nextTries[i] >= REVEAL_AFTER) nextLocked[i] = true;
      }
    });
    setTries(nextTries);
    setWrongNow(nextWrong);
    setLocked(nextLocked);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="rounded-xl bg-cic-tint p-4">
        {isPre
          ? "This warm-up shows what you already know. It's okay to guess — it doesn't count against you."
          : "Same questions as the warm-up. If one isn't right you'll get a hint and can try again — but your first try is what counts."}
      </p>
      {qs.map((q, i) => {
        const gaveUp = locked[i] && answers[i] !== q.answerIndex;
        return (
          <div key={q.id}>
            <QuestionCard
              q={q}
              index={i}
              value={answers[i]}
              disabled={locked[i]}
              reveal={gaveUp}
              markWrong={wrongNow[i] && !gaveUp}
              flagged={flagged[i]}
              onToggleFlag={locked[i] ? undefined : () => setFlagged((f) => f.map((x, j) => (j === i ? !x : x)))}
              onChange={(v) => {
                setAnswers((a) => a.map((x, j) => (j === i ? v : x)));
                setWrongNow((w) => w.map((x, j) => (j === i ? false : x)));
              }}
            />
            <div aria-live="polite">
              {wrongNow[i] && !gaveUp && (
                <div key={tries[i]} className="mt-2 flex animate-shake gap-3 rounded-xl bg-cic-warn-bg p-4 text-cic-warn">
                  <Lightbulb aria-hidden className="size-5 shrink-0" />
                  <p>
                    <strong>Not quite — here&apos;s a hint:</strong> {q.hint}
                  </p>
                </div>
              )}
              {gaveUp && (
                <div className="mt-2 flex gap-3 rounded-xl bg-cic-tint p-4 text-cic-darker">
                  <CheckCircle2 aria-hidden className="size-5 shrink-0" />
                  <p>
                    <strong>That one&apos;s tricky.</strong> {q.explanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
      {finished ? (
        <div role="status" className="animate-pop rounded-[var(--radius-card)] border-2 border-cic-dark bg-cic-tint p-5">
          <p className="text-xl font-bold">
            You got {Math.round(firstScore * qs.length)} of {qs.length} right on your first try.
          </p>
          <p className="mt-1 text-sm text-cic-muted">That first try is your score. The hints are there to help you learn.</p>
          <Button type="button" className="mt-3" onClick={() => onComplete({ attempts: Math.max(1, ...tries.map((t) => t + 1)), score: firstScore, response: first ?? answers })}>
            Finish module <ArrowRight aria-hidden className="size-5" />
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {flagged.some(Boolean) && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-cic-warn bg-cic-warn-bg p-3 text-sm">
              <Flag aria-hidden className="size-4 fill-current text-cic-warn" />
              <span className="font-bold text-cic-darker">Marked for review:</span>
              {qs.map((q, i) =>
                flagged[i] ? (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(`question-${q.id}`);
                      el?.scrollIntoView({ block: "start" });
                      el?.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus({ preventScroll: true });
                    }}
                    className="min-h-11 rounded-lg bg-white px-3 font-bold text-cic-darker underline underline-offset-2"
                  >
                    Question {i + 1}
                  </button>
                ) : null,
              )}
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
          {!all && <p className="text-sm text-cic-muted">Answer every question to continue.</p>}
          <Button type="submit" disabled={!all}>
            {isPre ? "Submit warm-up" : first ? "Check again" : "Submit answers"} <ArrowRight aria-hidden className="size-5" />
          </Button>
          </div>
        </div>
      )}
    </form>
  );
}

// ---------- Check for understanding ----------

export function CheckActivity({ activity, onComplete, onFailedCheck }: ActivityProps<"check">) {
  const q = activity.questions[0];
  const [value, setValue] = useState<number | undefined>();
  const [attempts, setAttempts] = useState(0);
  const [state, setState] = useState<"idle" | "wrong" | "right">("idle");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value === undefined) return;
        const n = attempts + 1;
        setAttempts(n);
        if (value === q.answerIndex) setState("right");
        else {
          setState("wrong");
          onFailedCheck?.();
        }
      }}
      className="space-y-4"
    >
      <QuestionCard
        q={q}
        index={0}
        value={value}
        disabled={state === "right"}
        reveal={state === "right"}
        onChange={(v) => {
          setValue(v);
          if (state === "wrong") setState("idle");
        }}
      />
      <div aria-live="polite">
        {state === "wrong" && (
          <div key={attempts} className="flex animate-shake gap-3 rounded-xl bg-cic-warn-bg p-4 text-cic-warn">
            <Lightbulb aria-hidden className="size-5 shrink-0" />
            <p>
              <strong>Not quite — here&apos;s a hint:</strong> {q.hint}
            </p>
          </div>
        )}
        {state === "right" && (
          <div className="flex animate-pop gap-3 rounded-xl bg-cic-tint p-4 text-cic-darker">
            <CheckCircle2 aria-hidden className="size-5 shrink-0" />
            <p>
              <strong>Nice!</strong> {q.explanation}
            </p>
          </div>
        )}
      </div>
      <div className="flex justify-end">
        {state === "right" ? (
          <Button type="button" onClick={() => // The first try counts: right straight away = 1, a hint and a retry first = 0.
            onComplete({ attempts, score: attempts === 1 ? 1 : 0, response: value })}>
            Continue <ArrowRight aria-hidden className="size-5" />
          </Button>
        ) : (
          <Button type="submit" disabled={value === undefined}>
            Check answer
          </Button>
        )}
      </div>
    </form>
  );
}

// ---------- Worksheet ----------

export function WorksheetActivity({ activity, onComplete }: ActivityProps<"worksheet">) {
  const draftKey = `cic.draft.${activity.id}`;
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (raw) setValues(JSON.parse(raw));
    } catch {
      /* storage blocked */
    }
  }, [draftKey]);

  function update(id: string, v: string) {
    const next = { ...values, [id]: v };
    setValues(next);
    try {
      window.localStorage.setItem(draftKey, JSON.stringify(next));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }

  const complete = activity.fields.every((f) => (values[f.id] ?? "").trim().length > 0);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!complete) return;
        try {
          window.localStorage.removeItem(draftKey);
        } catch {
          /* ignore */
        }
        onComplete({ attempts: 1, response: values });
      }}
      className="space-y-5"
    >
      <p className="text-lg">
        <ReadableText text={activity.intro} />
      </p>
      {activity.link && (
        <a
          href={activity.link.href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-cic-dark px-4 font-bold text-cic-dark hover:bg-cic-tint"
        >
          {activity.link.label} <ExternalLink aria-hidden className="size-4" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}
      {activity.fields.map((f, i) => {
        const id = `${activity.id}-${f.id}`;
        return (
          <div key={f.id}>
            <label htmlFor={id} className="block font-bold">
              {i + 1}. <ReadableText text={f.label} />
            </label>
            {f.help && (
              <p id={`${id}-help`} className="text-sm text-cic-muted">
                <ReadableText text={f.help} />
              </p>
            )}
            {f.kind === "long" ? (
              <textarea
                id={id}
                rows={3}
                value={values[f.id] ?? ""}
                onChange={(e) => update(f.id, e.target.value)}
                aria-describedby={f.help ? `${id}-help` : undefined}
                className="mt-2 w-full rounded-xl border-2 border-cic-line p-3 focus:border-cic-dark"
              />
            ) : (
              <input
                id={id}
                type={f.kind === "number" ? "number" : "text"}
                inputMode={f.kind === "number" ? "numeric" : undefined}
                value={values[f.id] ?? ""}
                onChange={(e) => update(f.id, e.target.value)}
                aria-describedby={f.help ? `${id}-help` : undefined}
                className="mt-2 w-full rounded-xl border-2 border-cic-line p-3 focus:border-cic-dark"
              />
            )}
          </div>
        );
      })}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-sm text-cic-muted">
          {saved ? "Draft saved on this device." : "Your answers save as you type."}
        </p>
        <Button type="submit" disabled={!complete}>
          Submit worksheet <ArrowRight aria-hidden className="size-5" />
        </Button>
      </div>
    </form>
  );
}

// ---------- Exit question ----------

export function ExitActivity({ activity, onComplete }: ActivityProps<"exit">) {
  const [text, setText] = useState("");
  const id = useId();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim().length < 3) return;
        onComplete({ attempts: 1, response: text.trim() });
      }}
      className="space-y-4"
    >
      <label htmlFor={id} className="block text-xl font-bold">
        <ReadableText text={activity.prompt} />
      </label>
      <textarea
        id={id}
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full rounded-xl border-2 border-cic-line p-3 text-lg focus:border-cic-dark"
        placeholder="Write a sentence or two…"
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={text.trim().length < 3}>
          Submit <ArrowRight aria-hidden className="size-5" />
        </Button>
      </div>
    </form>
  );
}
