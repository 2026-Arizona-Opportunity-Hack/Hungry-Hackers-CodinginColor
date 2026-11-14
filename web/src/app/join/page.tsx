"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Delete, Info, ShieldCheck } from "lucide-react";
import { Button, Logo, cx } from "@/components/ui";
import { PICTURES, pictureName, sameCode } from "@/lib/picture-codes";
import { findClassByCode, setSession } from "@/lib/repo";
import { DEMO_CLASS_CODE, DEMO_STUDENT } from "@/lib/demo-data";
import type { Classroom, RosterStudent } from "@/lib/types";

type Step = "code" | "name" | "picture";

export default function JoinPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [cls, setCls] = useState<Classroom | null>(null);
  const [student, setStudent] = useState<RosterStudent | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the new step's heading so screen readers announce it.
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    const found = findClassByCode(code);
    if (!found) {
      setError("We couldn't find that class code. Check it with your teacher — it's 6 letters and numbers.");
      return;
    }
    setError(null);
    setCls(found);
    setStep("name");
  }

  function chooseName(s: RosterStudent) {
    setStudent(s);
    setPicked([]);
    setError(null);
    setStep("picture");
  }

  function tap(emoji: string) {
    if (picked.length >= 3) return;
    const next = [...picked, emoji];
    setPicked(next);
    if (next.length === 3 && student && cls) {
      if (sameCode(next, student.pictureCode)) {
        setSession({ classId: cls.id, studentId: student.id });
        router.push("/learn");
      } else {
        setTries((t) => t + 1);
        setError("Those pictures don't match. Try again, or ask your teacher for your picture code.");
        setPicked([]);
      }
    }
  }

  return (
    <div className="min-h-dvh bg-cic-tint">
      <main id="main" tabIndex={-1} className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10">
        <div className="rounded-[var(--radius-card)] bg-white p-6 shadow-sm md:p-8">
          <Logo variant="stacked" className="mx-auto h-auto w-28" />

          <ol aria-label="Steps" className="mt-6 flex justify-center gap-2 text-sm">
            {(["code", "name", "picture"] as Step[]).map((s, i) => {
              const idx = ["code", "name", "picture"].indexOf(step);
              return (
                <li
                  key={s}
                  aria-current={s === step ? "step" : undefined}
                  className={cx(
                    "rounded-full px-3 py-1 font-bold",
                    i < idx ? "bg-cic-tint text-cic-darker" : s === step ? "bg-cic-dark text-white" : "text-cic-muted",
                  )}
                >
                  {i + 1}. {s === "code" ? "Class code" : s === "name" ? "Your name" : "Picture code"}
                </li>
              );
            })}
          </ol>

          {step === "code" && (
            <form onSubmit={submitCode} className="mt-6" noValidate>
              <h1 ref={headingRef} tabIndex={-1} className="text-center text-2xl font-bold text-cic-dark">
                Join a classroom
              </h1>
              <p className="mt-1 text-center text-cic-muted">Jump in with your class code — no account needed.</p>
              <label htmlFor="code" className="mt-6 block font-bold">
                Class code
              </label>
              <input
                id="code"
                name="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={10}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "code-error" : "code-help"}
                placeholder="e.g. ABC123"
                className="mt-2 w-full rounded-xl border-2 border-cic-line px-4 py-3 font-mono text-2xl tracking-widest uppercase placeholder:text-cic-muted focus:border-cic-dark"
              />
              <p id="code-help" className="mt-2 text-sm text-cic-muted">
                Your teacher will write it on the board.
              </p>
              {error && (
                <p id="code-error" role="alert" className="mt-2 rounded-lg bg-cic-danger-bg p-3 text-cic-danger">
                  {error}
                </p>
              )}
              <Button type="submit" className="mt-6 w-full text-lg" disabled={code.trim().length < 4}>
                Next <ArrowRight aria-hidden className="size-5" />
              </Button>
            </form>
          )}

          {step === "name" && cls && (
            <div className="mt-6">
              <h1 ref={headingRef} tabIndex={-1} className="text-center text-2xl font-bold text-cic-dark">
                Which one is you?
              </h1>
              <p className="mt-1 text-center text-cic-muted">
                {cls.school} · {cls.name}
              </p>
              <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {cls.roster.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => chooseName(s)}
                      className="min-h-12 w-full rounded-xl border-2 border-cic-line px-3 py-2 font-bold hover:border-cic-dark hover:bg-cic-tint"
                    >
                      {s.firstName} {s.lastInitial && `${s.lastInitial}.`}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-cic-muted">Don&apos;t see your name? Ask your teacher to add you to the roster.</p>
              <Button variant="ghost" className="mt-2" onClick={() => setStep("code")}>
                <ArrowLeft aria-hidden className="size-5" /> Different class code
              </Button>
            </div>
          )}

          {step === "picture" && student && (
            <div className="mt-6">
              <h1 ref={headingRef} tabIndex={-1} className="text-center text-2xl font-bold text-cic-dark">
                Hi, {student.firstName}! Tap your 3 pictures
              </h1>
              <p className="mt-1 text-center text-cic-muted">In order. This keeps your work yours.</p>

              <div aria-live="polite" className="mt-5 flex justify-center gap-3">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={cx(
                      "grid size-16 place-items-center rounded-xl border-2 text-3xl",
                      picked[i] ? "border-cic-dark bg-cic-tint" : "border-dashed border-cic-line",
                    )}
                  >
                    {picked[i] ? (
                      <>
                        <span aria-hidden>{picked[i]}</span>
                        <span className="sr-only">{pictureName(picked[i])}</span>
                      </>
                    ) : (
                      <span className="sr-only">empty</span>
                    )}
                  </span>
                ))}
              </div>

              {error && (
                <p role="alert" className="mt-4 rounded-lg bg-cic-danger-bg p-3 text-center text-cic-danger">
                  {error}
                  {tries >= 3 && " Your teacher can see your picture code on the Roster page."}
                </p>
              )}

              <div role="group" aria-label="Pictures" className="mx-auto mt-5 grid max-w-xs grid-cols-3 gap-3">
                {PICTURES.map((p) => (
                  <button
                    key={p.emoji}
                    type="button"
                    onClick={() => tap(p.emoji)}
                    aria-label={p.name}
                    className="grid aspect-square place-items-center rounded-xl border-2 border-cic-line text-4xl hover:border-cic-dark hover:bg-cic-tint"
                  >
                    <span aria-hidden>{p.emoji}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4 flex justify-between">
                <Button variant="ghost" onClick={() => setStep("name")}>
                  <ArrowLeft aria-hidden className="size-5" /> Not me
                </Button>
                <Button variant="ghost" onClick={() => setPicked((p) => p.slice(0, -1))} disabled={picked.length === 0}>
                  <Delete aria-hidden className="size-5" /> Undo
                </Button>
              </div>
            </div>
          )}

          <p className="mt-6 flex items-start gap-2 border-t border-cic-line pt-4 text-sm text-cic-muted">
            <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-cic-dark" />
            We only keep your first name and last initial. No email, no password, no account.
          </p>
        </div>

        <details className="mt-4 rounded-xl bg-white p-4 text-sm">
          <summary className="flex cursor-pointer items-center gap-2 font-bold text-cic-dark">
            <Info aria-hidden className="size-4" /> Demo login for judges
          </summary>
          <p className="mt-2">
            Class code <strong className="font-mono">{DEMO_CLASS_CODE}</strong>, then{" "}
            <strong>
              {DEMO_STUDENT.firstName} {DEMO_STUDENT.lastInitial}.
            </strong>
            , then{" "}
            {DEMO_STUDENT.pictureCode.map((e) => (
              <span key={e}>
                <span aria-hidden>{e}</span>
                <span className="sr-only">{pictureName(e)}</span>{" "}
              </span>
            ))}
            ({DEMO_STUDENT.pictureCode.map(pictureName).join(", ")}).
          </p>
        </details>
      </main>
    </div>
  );
}
