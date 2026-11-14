"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FlaskConical, Lightbulb, Loader2, Play, RotateCcw, Square, XCircle } from "lucide-react";
import { Button, cx } from "./ui";
import type { ActivityProps } from "./activities";
import { PythonRunner, type TestResult } from "@/lib/python-runner";

// CodeMirror only loads when a code activity opens.
const CodeEditor = dynamic(() => import("./code-editor").then((m) => m.CodeEditor), {
  ssr: false,
  loading: () => <div className="h-56 animate-pulse rounded-xl bg-cic-tint" />,
});

const MAX_ATTEMPTS_BEFORE_SKIP = 3;

export function CodeActivity({ activity, onComplete, onFailedCheck }: ActivityProps<"code">) {
  const runner = useRef<PythonRunner | null>(null);
  const [code, setCode] = useState(activity.starter);
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState<{ stream: "stdout" | "stderr" | "info"; text: string }[]>([]);
  const [pyState, setPyState] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState<null | "run" | "test">(null);
  const [tests, setTests] = useState<TestResult[] | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hintsShown, setHintsShown] = useState(0);

  useEffect(() => {
    const r = new PythonRunner();
    runner.current = r;
    r.warmUp(
      () => setPyState("ready"),
      () => setPyState("error"),
    );
    return () => r.stop();
  }, []);

  const allPassed = tests !== null && tests.length > 0 && tests.every((t) => t.ok);

  async function run() {
    if (!runner.current) return;
    setBusy("run");
    setOutput([]);
    const res = await runner.current.run(code, stdin, (stream, text) => setOutput((o) => [...o, { stream, text }]));
    if (!res.ok && res.error) setOutput((o) => [...o, { stream: "stderr", text: res.error! }]);
    if (res.ok) setOutput((o) => (o.length ? o : [{ stream: "info", text: "(Your program ran but didn't print anything.)" }]));
    setBusy(null);
  }

  async function check() {
    if (!runner.current) return;
    setBusy("test");
    const res = await runner.current.test(code, activity.tests);
    const n = attempts + 1;
    setAttempts(n);
    if (res.error && res.results.length === 0) {
      setTests(activity.tests.map((t) => ({ description: t.description, ok: false, got: res.error! })));
      onFailedCheck?.();
    } else {
      setTests(res.results);
      if (!res.results.every((t) => t.ok)) onFailedCheck?.();
    }
    setBusy(null);
  }

  function stop() {
    runner.current?.stop();
    setBusy(null);
    setOutput((o) => [...o, { stream: "info", text: "Stopped." }]);
    setPyState("loading");
    runner.current?.warmUp(
      () => setPyState("ready"),
      () => setPyState("error"),
    );
  }

  function submit(score: number) {
    onComplete({ attempts: Math.max(1, attempts), score, response: { code, hintsUsed: hintsShown } });
  }

  const passed = tests?.filter((t) => t.ok).length ?? 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="space-y-4">
        <section aria-labelledby="task">
          <h2 id="task" className="text-lg font-bold text-cic-dark">
            Your task
          </h2>
          <ol className="mt-2 list-decimal space-y-2 pl-5">
            {activity.instructions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </section>
        {activity.exampleOutput && (
          <section aria-labelledby="example">
            <h2 id="example" className="font-bold">
              Example output
            </h2>
            <pre className="mt-1 rounded-xl bg-cic-tint p-3 font-mono text-sm">{activity.exampleOutput}</pre>
          </section>
        )}

        <section aria-labelledby="help" className="rounded-[var(--radius-card)] border-2 border-cic-line p-4">
          <h2 id="help" className="flex items-center gap-2 font-bold">
            <Lightbulb aria-hidden className="size-5 text-cic-warn" /> Need help?
          </h2>
          <p className="text-sm text-cic-muted">Hints nudge you in the right direction — they never give the answer. Your teacher wrote and approved them.</p>
          <ol aria-live="polite" className="mt-3 space-y-2">
            {activity.hints.slice(0, hintsShown).map((h, i) => (
              <li key={h} className="rounded-xl bg-cic-warn-bg p-3 text-sm text-black">
                <strong>Hint {i + 1}:</strong> {h}
              </li>
            ))}
          </ol>
          {hintsShown < activity.hints.length ? (
            <Button variant="secondary" className="mt-3" onClick={() => setHintsShown((n) => n + 1)}>
              <Lightbulb aria-hidden className="size-5" /> {hintsShown === 0 ? "Get a hint" : "Another hint"}
            </Button>
          ) : (
            <p className="mt-3 text-sm text-cic-muted">That&apos;s every hint. Try running your code line by line, or ask a classmate.</p>
          )}
        </section>
      </div>

      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-mono font-bold">main.py</h2>
          <p role="status" className="flex items-center gap-1.5 text-sm text-cic-muted">
            {pyState === "loading" && (
              <>
                <Loader2 aria-hidden className="size-4 animate-spin" /> Loading Python…
              </>
            )}
            {pyState === "ready" && (
              <>
                <CheckCircle2 aria-hidden className="size-4 text-cic-dark" /> Python ready — runs in your browser
              </>
            )}
            {pyState === "error" && "Python couldn't load. Check your connection and reload."}
          </p>
        </div>
        <p id="editor-help" className="text-sm text-cic-muted">
          Tab indents. To leave the editor with the keyboard, press Esc, then Tab.
        </p>
        <CodeEditor value={code} onChange={setCode} label="Python code editor" describedBy="editor-help" />

        <div className="flex flex-wrap gap-2">
          {busy ? (
            <Button onClick={stop} variant="secondary">
              <Square aria-hidden className="size-4" /> Stop
            </Button>
          ) : (
            <Button onClick={run} disabled={pyState !== "ready"}>
              <Play aria-hidden className="size-5" /> Run code
            </Button>
          )}
          <Button variant="secondary" onClick={check} disabled={pyState !== "ready" || busy !== null}>
            <FlaskConical aria-hidden className="size-5" /> Check my code
          </Button>
          <Button variant="ghost" onClick={() => setCode(activity.starter)} disabled={busy !== null}>
            <RotateCcw aria-hidden className="size-4" /> Reset
          </Button>
        </div>

        <details className="rounded-xl border border-cic-line p-3 text-sm">
          <summary className="cursor-pointer font-bold">Program input (for input())</summary>
          <label htmlFor="stdin" className="mt-2 block text-cic-muted">
            One line per input() call.
          </label>
          <textarea id="stdin" rows={2} value={stdin} onChange={(e) => setStdin(e.target.value)} className="mt-1 w-full rounded-lg border-2 border-cic-line p-2 font-mono" />
        </details>

        <section aria-labelledby="console">
          <h2 id="console" className="text-sm font-bold">
            Console
          </h2>
          <pre role="log" aria-live="polite" className="mt-1 min-h-24 overflow-x-auto rounded-xl bg-[#0f2a1c] p-4 font-mono text-sm text-white">
            {busy === "run" && output.length === 0 && "Running…"}
            {output.map((o, i) => (
              <span key={i} className={cx("block", o.stream === "stderr" && "text-[#ffb4b4]", o.stream === "info" && "text-[#c8e6d4]")}>
                {o.text}
              </span>
            ))}
          </pre>
        </section>

        {tests && (
          <section aria-labelledby="results" className="rounded-[var(--radius-card)] border-2 border-cic-line p-4">
            <h2 id="results" className="font-bold">
              Tests: {passed} of {tests.length} passing
            </h2>
            <ul className="mt-2 space-y-1">
              {tests.map((t) => (
                <li key={t.description} className="flex items-start gap-2">
                  {t.ok ? (
                    <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-cic-dark" />
                  ) : (
                    <XCircle aria-hidden className="mt-0.5 size-5 shrink-0 text-cic-danger" />
                  )}
                  <span>
                    <span className="sr-only">{t.ok ? "Passed: " : "Failed: "}</span>
                    {t.description}
                    {!t.ok && <span className="block font-mono text-sm text-cic-muted">Got: {t.got}</span>}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2" aria-live="polite">
              {allPassed ? (
                <Button onClick={() => submit(1)}>
                  <CheckCircle2 aria-hidden className="size-5" /> All tests pass — submit
                </Button>
              ) : attempts >= MAX_ATTEMPTS_BEFORE_SKIP ? (
                <Button variant="secondary" onClick={() => submit(passed / tests.length)}>
                  Submit what I have and move on
                </Button>
              ) : null}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
