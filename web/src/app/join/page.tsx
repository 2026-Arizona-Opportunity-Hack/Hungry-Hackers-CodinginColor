"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Delete, Info, ShieldCheck } from "lucide-react";
import { Brackets, Button, Logo, cx } from "@/components/ui";
import { PICTURES, pictureName, sameCode } from "@/lib/picture-codes";
import { findClassByCode, setJoinedClass, setSession } from "@/lib/repo";
import { DEMO_CLASS_CODE, DEMO_STUDENT } from "@/lib/demo-data";
import type { Classroom, PictureCode } from "@/lib/types";

type Step = "code" | "name" | "picture";

/** A roster name. `pictureCode` is only present for local (offline demo) classes. */
interface JoinStudent {
  id: string;
  firstName: string;
  lastInitial: string;
  pictureCode?: PictureCode;
}

/** "server": found in Supabase, pictures are checked by /api/join/student. "local": demo data in this browser. */
interface JoinClass {
  id: string;
  name: string;
  school: string;
  roster: JoinStudent[];
  source: "server" | "local";
}

const NOT_FOUND = "We couldn't find that class code. Check it with your teacher — it's 6 letters and numbers.";
const WRONG_PICTURES = "Those pictures don't match. Try again, or ask your teacher for your picture code.";
const LOCKED = "Too many tries. Wait 15 minutes, or ask your teacher for your picture code.";
const TROUBLE = "Something went wrong on our end. Please try again in a moment.";

/** Asks the server first; falls back to local demo data if Supabase isn't reachable or set up. */
async function lookUpClass(code: string): Promise<JoinClass | "not_found" | "error"> {
  try {
    const res = await fetch("/api/join/class", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (res.ok) return { ...(await res.json()), source: "server" };
    if (res.status !== 404 && res.status !== 503) return "error";
  } catch {
    /* offline — try local data */
  }
  const local = findClassByCode(code);
  return local ? { id: local.id, name: local.name, school: local.school, roster: local.roster, source: "local" } : "not_found";
}

export default function JoinPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [cls, setCls] = useState<JoinClass | null>(null);
  const [student, setStudent] = useState<JoinStudent | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  const [busy, setBusy] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the new step's heading so screen readers announce it.
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const found = await lookUpClass(code);
    setBusy(false);
    if (found === "not_found" || found === "error") {
      setError(found === "error" ? TROUBLE : NOT_FOUND);
      return;
    }
    setError(null);
    setCls(found);
    setStep("name");
  }

  function chooseName(s: JoinStudent) {
    setStudent(s);
    setPicked([]);
    setError(null);
    setStep("picture");
  }

  function wrong(message: string) {
    setTries((t) => t + 1);
    setError(message);
    setPicked([]);
  }

  async function tap(emoji: string) {
    if (picked.length >= 3 || busy) return;
    const next = [...picked, emoji];
    setPicked(next);
    if (next.length < 3 || !student || !cls) return;

    if (cls.source === "local") {
      if (student.pictureCode && sameCode(next, student.pictureCode)) {
        setSession({ classId: cls.id, studentId: student.id });
        router.push("/learn");
      } else wrong(WRONG_PICTURES);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/join/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: cls.id, studentId: student.id, pictureCode: next }),
      });
      if (res.ok) {
        const joined = (await res.json()) as Classroom;
        setJoinedClass(joined);
        setSession({ classId: joined.id, studentId: student.id });
        router.push("/learn");
        return;
      }
      wrong(res.status === 401 ? WRONG_PICTURES : res.status === 429 ? LOCKED : TROUBLE);
    } catch {
      wrong(TROUBLE);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-cic-dark">
      <Brackets className="pointer-events-none absolute -top-16 -left-24 w-[28rem] text-cic-green opacity-30" />
      <Brackets className="pointer-events-none absolute -right-24 -bottom-16 w-[32rem] text-cic-darker" />
      <main id="main" tabIndex={-1} className="relative mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10">
        <div className="rounded-[28px] bg-white p-6 shadow-[0_8px_0_var(--color-cic-darker)] md:p-8">
          <Logo variant="stacked" className="mx-auto h-auto w-28" />

          <ol aria-label="Steps" className="mt-6 flex justify-center gap-2 text-sm">
            {(["code", "name", "picture"] as Step[]).map((s, i) => {
              const idx = ["code", "name", "picture"].indexOf(step);
              return (
                <li
                  key={s}
                  aria-current={s === step ? "step" : undefined}
                  className={cx(
                    "rounded-full px-3 py-1.5 font-bold",
                    i < idx ? "bg-cic-tint text-cic-darker" : s === step ? "bg-cic-dark text-white shadow-slab" : "bg-white text-cic-muted ring-2 ring-cic-line ring-inset",
                  )}
                >
                  {i + 1}. {s === "code" ? "Class code" : s === "name" ? "Your name" : "Picture code"}
                </li>
              );
            })}
          </ol>

          {step === "code" && (
            <form onSubmit={submitCode} className="mt-6 animate-rise" noValidate>
              <h1 ref={headingRef} tabIndex={-1} className="text-center font-display text-3xl text-cic-dark">
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
                className="mt-2 w-full rounded-2xl border-2 border-cic-line bg-cic-tint px-4 py-4 text-center font-display text-3xl tracking-[0.3em] uppercase shadow-[inset_0_3px_0_rgba(0,0,0,0.06)] placeholder:text-cic-muted placeholder:tracking-normal focus:border-cic-dark focus:bg-white"
              />
              <p id="code-help" className="mt-2 text-sm text-cic-muted">
                Your teacher will write it on the board.
              </p>
              {error && (
                <p id="code-error" role="alert" className="mt-2 rounded-lg bg-cic-danger-bg p-3 text-cic-danger">
                  {error}
                </p>
              )}
              <Button type="submit" className="mt-6 w-full text-lg" disabled={busy || code.trim().length < 4}>
                Next <ArrowRight aria-hidden className="size-5" />
              </Button>
            </form>
          )}

          {step === "name" && cls && (
            <div className="mt-6 animate-rise">
              <h1 ref={headingRef} tabIndex={-1} className="text-center font-display text-3xl text-cic-dark">
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
                      className="min-h-14 w-full rounded-2xl border-2 border-cic-line bg-white px-3 py-2 text-lg font-bold shadow-slab-gray transition-[transform,box-shadow] duration-100 hover:border-cic-dark hover:bg-cic-tint active:translate-y-[3px] active:shadow-slab-gray-pressed"
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
            <div className="mt-6 animate-rise">
              <h1 ref={headingRef} tabIndex={-1} className="text-center font-display text-3xl text-cic-dark">
                Hi, {student.firstName}! Tap your 3 pictures
              </h1>
              <p className="mt-1 text-center text-cic-muted">In order. This keeps your work yours.</p>

              <div key={tries} aria-live="polite" className={cx("mt-5 flex justify-center gap-3", tries > 0 && "animate-shake")}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={`${i}-${picked[i] ?? ""}`}
                    className={cx(
                      "grid size-16 place-items-center rounded-xl border-2 text-3xl",
                      picked[i] ? "animate-pop border-cic-dark bg-cic-tint" : "border-dashed border-cic-line",
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
                    className="grid aspect-square place-items-center rounded-2xl border-2 border-cic-line bg-white text-5xl shadow-slab-gray transition-[transform,box-shadow] duration-100 hover:border-cic-dark hover:bg-cic-tint active:translate-y-[3px] active:shadow-slab-gray-pressed"
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
