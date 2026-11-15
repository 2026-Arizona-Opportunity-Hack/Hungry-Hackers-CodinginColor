"use client";

import { Send, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Card, EmptyState, LinkButton, Loading, PageTitle } from "@/components/ui";
import { LoadProblem, NoClasses } from "@/components/teacher-states";
import { useTeacherClass } from "@/lib/use-teacher";

const SUGGESTIONS = [
  "Who needs my help most this week, and why?",
  "Which concept should I reteach next class?",
  "Suggest small groups for tomorrow based on progress.",
  "Where is the class growing the most between warm-up and wrap-up?",
];

const MAX = 500;

interface Turn {
  question: string;
  answer?: string;
  error?: string;
}

export default function ClassAssistant() {
  const { ctx, error } = useTeacherClass();
  const [remaining, setRemaining] = useState<number | null>(null);
  const [configured, setConfigured] = useState(true);
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/teacher/ask")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setRemaining(d.remaining);
        setConfigured(d.configured);
      })
      .catch(() => {});
  }, []);

  if (error) return <LoadProblem message={error} />;
  if (ctx === undefined) return <Loading />;
  if (ctx === null) return <NoClasses />;
  const { cls } = ctx;

  async function ask(q: string) {
    const text = q.trim();
    if (!text || busy) return;
    setBusy(true);
    setQuestion("");
    setTurns((t) => [...t, { question: text }]);
    let result: Turn = { question: text };
    try {
      const r = await fetch("/api/teacher/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: cls.id, question: text }),
      });
      const d = await r.json().catch(() => ({}));
      if (typeof d.remaining === "number") setRemaining(d.remaining);
      result = r.ok ? { question: text, answer: d.answer } : { question: text, error: d.error ?? "Something went wrong." };
    } catch {
      result = { question: text, error: "Couldn't reach the assistant. Check your connection." };
    }
    setTurns((t) => [...t.slice(0, -1), result]);
    setBusy(false);
  }

  const out = remaining === 0;
  const disabled = busy || out || !configured;

  return (
    <div className="space-y-6">
      <PageTitle
        title="Class assistant"
        subtitle={
          <>
            Ask about <strong>{cls.name}</strong>&apos;s progress and get ideas for what to do next.
          </>
        }
        actions={
          remaining !== null && (
            <span className="rounded-full bg-cic-tint px-4 py-2 font-bold text-cic-darker" aria-live="polite">
              {remaining} of 10 questions left this week
            </span>
          )
        }
      />

      <p className="flex items-start gap-2 rounded-2xl bg-cic-tint p-3 text-sm text-cic-darker">
        <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
        <span>
          Student names are replaced with labels before anything is sent to the AI, and students&apos; written answers are never
          sent. AI can be wrong: check its ideas against your dashboard.
        </span>
      </p>

      {cls.roster.length === 0 ? (
        <EmptyState title="No students yet" action={<LinkButton href="/teach/roster">Add students</LinkButton>}>
          The assistant can help once students start working.
        </EmptyState>
      ) : (
        <>
          {!configured && (
            <p role="alert" className="rounded-xl bg-cic-warn-bg p-3 font-bold text-cic-warn">
              The class assistant isn&apos;t set up on this site yet.
            </p>
          )}

          {turns.length === 0 && (
            <div>
              <h2 className="font-bold text-cic-darker">Try asking</h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => ask(s)}
                      className="min-h-11 rounded-xl border-2 border-cic-line bg-white px-3 py-2 text-left text-sm font-bold text-cic-darker hover:bg-cic-tint disabled:opacity-50"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ol className="space-y-4" aria-live="polite">
            {turns.map((t, i) => (
              <li key={i} className="space-y-2">
                <p className="ml-auto w-fit max-w-prose rounded-2xl bg-cic-dark px-4 py-2 text-white">{t.question}</p>
                <Card className="max-w-prose">
                  <p className="mb-1 flex items-center gap-1.5 text-sm font-bold text-cic-muted">
                    <Sparkles aria-hidden className="size-4" /> Assistant
                  </p>
                  {t.answer ? (
                    <p className="whitespace-pre-wrap">{t.answer}</p>
                  ) : t.error ? (
                    <p role="alert" className="font-bold text-cic-danger">
                      {t.error}
                    </p>
                  ) : (
                    <p className="text-cic-muted">Looking at your class data…</p>
                  )}
                </Card>
              </li>
            ))}
          </ol>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(question);
            }}
            className="space-y-2"
          >
            <label htmlFor="ask" className="block font-bold">
              Your question
            </label>
            <textarea
              id="ask"
              value={question}
              maxLength={MAX}
              rows={3}
              disabled={disabled}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask(question);
                }
              }}
              placeholder={out ? "You've used this week's questions. They reset on Monday." : "e.g. Who is stuck on Module 2?"}
              className="w-full rounded-xl border-2 border-cic-line bg-white p-3 text-black disabled:opacity-60"
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-cic-muted">
                {question.length}/{MAX}
              </span>
              <Button type="submit" disabled={disabled || !question.trim()}>
                <Send aria-hidden className="size-4" /> {busy ? "Thinking…" : "Ask"}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
