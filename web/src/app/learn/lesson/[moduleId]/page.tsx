"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, FastForward, Lock, PartyPopper, RotateCcw, Timer, TrendingUp, Undo2 } from "lucide-react";
import { CheckActivity, ExitActivity, QuizActivity, SlidesActivity, WorksheetActivity, type Completion } from "@/components/activities";
import { CodeActivity } from "@/components/code-activity";
import { Confetti } from "@/components/confetti";
import { Brackets, Button, Card, LinkButton, Loading, cx } from "@/components/ui";
import { STAGE_ICONS } from "@/components/stage-icon";
import { isDone, isSkipped, moduleGain, moduleUnlocked, pct, signedPct, skippedActivities } from "@/lib/analytics";
import { recordFailedCheck, recordResult, skipActivity, unskipActivity } from "@/lib/repo";
import { STAGE_LABELS, type Activity } from "@/lib/types";
import { useStudent } from "@/lib/use-student";

/**
 * Seconds spent on the current activity, counting only while the tab is
 * visible. Restarts from 0 whenever `key` (the activity id) changes.
 */
function useActiveTimer(key: string | undefined) {
  const [secs, setSecs] = useState(0);
  const banked = useRef(0);
  const since = useRef<number | null>(null);
  const read = () => Math.round((banked.current + (since.current ? Date.now() - since.current : 0)) / 1000);

  useEffect(() => {
    banked.current = 0;
    since.current = document.hidden ? null : Date.now();
    setSecs(0);
    const tick = () => setSecs(read());
    const onVisibility = () => {
      if (document.hidden && since.current) {
        banked.current += Date.now() - since.current;
        since.current = null;
      } else if (!document.hidden && !since.current) {
        since.current = Date.now();
      }
      tick();
    };
    const t = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [key]);

  return { secs, read };
}

function ActivityTimer({ secs, estimate }: { secs: number; estimate: number }) {
  const m = Math.floor(secs / 60);
  const s = String(secs % 60).padStart(2, "0");
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-cic-tint px-3 py-1 text-sm font-bold text-cic-dark">
      <Timer aria-hidden className="size-4" />
      <span role="timer" aria-label={`Time on this activity: ${m} minutes ${secs % 60} seconds`} className="tabular-nums">
        {m}:{s}
      </span>
      <span className="font-normal text-cic-muted">· about {estimate} min</span>
    </span>
  );
}

export default function LessonPlayer() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const ctx = useStudent();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [justFinished, setJustFinished] = useState(false);
  // A finished activity the student opened again. `mode` is "look" (read the
  // old answers, nothing saved) or "redo" (try again; the best score is kept).
  const redoStartedAt = useRef(0);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewMode, setReviewMode] = useState<"look" | "redo">("look");
  // Bumps every redo submit so the activity remounts fresh.
  const [redoCount, setRedoCount] = useState(0);

  const mod = ctx?.modules.find((m) => m.id === moduleId);
  // Skipped activities don't block: show the first undone, unskipped activity,
  // and fall back to the first skipped one when that's all that remains.
  const firstOpen = mod?.activities.findIndex((a) => !isDone(ctx?.progress, a.id) && !isSkipped(ctx?.progress, a.id)) ?? -1;
  const firstUndone = mod?.activities.findIndex((a) => !isDone(ctx?.progress, a.id)) ?? -1;
  const index = firstOpen !== -1 ? firstOpen : firstUndone;
  const current: Activity | undefined = mod && index !== -1 ? mod.activities[index] : undefined;
  const timer = useActiveTimer(current?.id);

  // New activity (or opening one to review): move focus to its title.
  useEffect(() => {
    headingRef.current?.focus();
  }, [current?.id, reviewId]);

  // Switching modules or looking at a different activity leaves redo mode.
  useEffect(() => {
    setReviewId(null);
    setReviewMode("look");
  }, [moduleId]);
  useEffect(() => setReviewMode("look"), [reviewId]);

  if (!ctx) return <Loading />;
  const { cls, student, modules, progress } = ctx;

  if (!mod) {
    return (
      <Card>
        <h1 className="text-xl font-bold">We couldn&apos;t find that module.</h1>
        <LinkButton href="/learn/course" className="mt-4">
          Back to the course
        </LinkButton>
      </Card>
    );
  }

  const modIndex = modules.indexOf(mod);
  if (!moduleUnlocked(progress, modules, modIndex)) {
    return (
      <Card className="mx-auto max-w-xl text-center">
        <Lock aria-hidden className="mx-auto size-10 text-cic-muted" />
        <h1 className="mt-2 text-xl font-bold">Module {mod.number} is locked</h1>
        <p className="mt-1 text-cic-muted">Finish Module {mod.number - 1} first — modules unlock in order.</p>
        <LinkButton href={`/learn/lesson/${modules[modIndex - 1].id}`} className="mt-4">
          Go to Module {mod.number - 1}
        </LinkButton>
      </Card>
    );
  }

  function complete(c: Completion) {
    if (!current) return;
    recordResult(cls.id, student.id, {
      activityId: current.id,
      completedAt: new Date().toISOString(),
      score: c.score,
      attempts: c.attempts,
      secondsOnTask: timer.read(),
      response: c.response,
    });
    if (current.kind === "posttest") setJustFinished(true);
    window.scrollTo({ top: 0 });
  }

  const failed = () => current && recordFailedCheck(cls.id, student.id, current.id);
  /** Wrong answers during a redo still tell the teacher the student needs help. */
  const failedFor = (a: Activity) => () => recordFailedCheck(cls.id, student.id, a.id);

  /** Start a redo of a finished activity: show it fresh, keep the old score until submit. */
  function startRedo(a: Activity) {
    redoStartedAt.current = Date.now();
    setReviewId(a.id);
    setReviewMode("redo");
    window.scrollTo({ top: 0 });
  }

  /**
   * Submit a redo. The best score wins: a worse retry never lowers a grade,
   * and the new answer is only saved when it counts.
   */
  function completeRedo(a: Activity, c: Completion) {
    const old = progress.results[a.id];
    const best = (x: number | undefined, y: number | undefined) => Math.max(x ?? 0, y ?? 0);
    recordResult(cls.id, student.id, {
      activityId: a.id,
      completedAt: new Date().toISOString(),
      score:
        old?.score !== undefined || c.score !== undefined
          ? best(old?.score, c.score)
          : undefined,
      attempts: (old?.attempts ?? 0) + c.attempts,
      secondsOnTask: (old?.secondsOnTask ?? 0) + Math.round((Date.now() - redoStartedAt.current) / 1000),
      response: (c.score ?? 0) >= (old?.score ?? 0) ? c.response : old?.response,
    });
    setRedoCount((n) => n + 1);
    if (a.kind === "posttest") setJustFinished(true);
    leaveReview();
  }
  const nextModule = modules[modIndex + 1];
  const prevModule = modules[modIndex - 1];
  const gain = moduleGain(progress, mod);
  const reviewing = mod.activities.find((a) => a.id === reviewId && isDone(progress, a.id));
  const leaveReview = () => {
    setReviewId(null);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/learn/course" className="inline-flex min-h-11 items-center gap-1 font-bold text-cic-dark">
          <ChevronLeft aria-hidden className="size-5" /> Course map
        </Link>
        {prevModule && (
          <Link
            href={`/learn/lesson/${prevModule.id}`}
            className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 font-bold text-cic-dark hover:bg-cic-tint"
          >
            <ArrowLeft aria-hidden className="size-4" /> Previous module: {prevModule.number}. {prevModule.title}
          </Link>
        )}
      </div>
      <p className="mt-2 text-sm font-bold text-cic-muted">
        Module {mod.number} of {modules.length}
      </p>
      <p className="font-display text-2xl text-black md:text-3xl">{mod.title}</p>

      {/* Stage stepper */}
      <ol aria-label="Lesson steps" className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {mod.activities.map((a, i) => {
          const done = isDone(progress, a.id);
          const skipped = !done && isSkipped(progress, a.id);
          const now = reviewing ? a.id === reviewing.id : i === index;
          const Icon = done ? Check : skipped ? FastForward : STAGE_ICONS[a.kind];
          const step = (
            <>
              <span
                className={cx(
                  "grid size-11 place-items-center rounded-2xl transition-colors duration-500",
                  done && !now && "bg-cic-green text-white",
                  now && "animate-pop bg-cic-dark text-white shadow-slab",
                  !done && !now && !skipped && "bg-cic-tint text-cic-dark",
                  skipped && !now && "border-2 border-dashed border-cic-warn bg-cic-warn-bg text-cic-warn",
                )}
              >
                <Icon aria-hidden className="size-5" strokeWidth={done ? 3 : 2} />
              </span>
              <span className={cx("mt-2 block h-1.5 w-full rounded-full", done ? "bg-cic-green" : now ? "bg-cic-dark" : "bg-cic-tint")} />
              <span className={cx("mt-1 block text-center text-xs font-bold", now ? "text-cic-dark" : "text-cic-muted")}>
                {STAGE_LABELS[a.kind]}
                <span className="sr-only">{now ? " — showing now" : done ? " — done, open to review" : skipped ? " — skipped, come back later" : " — not started"}</span>
              </span>
            </>
          );
          return (
            <li key={a.id} aria-current={now ? "step" : undefined} className="flex min-w-20 flex-1 flex-col items-center">
              {done ? (
                <button
                  type="button"
                  onClick={() => setReviewId(a.id)}
                  title={`Review: ${a.title}`}
                  className="flex w-full flex-col items-center rounded-2xl pb-1 hover:bg-cic-tint"
                >
                  {step}
                </button>
              ) : (
                step
              )}
            </li>
          );
        })}
      </ol>

      {/* Come back to these: skipped but unfinished activities in this module. */}
      {skippedActivities(progress, mod).length > 0 && !reviewing && (
        <div role="status" className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-cic-warn bg-cic-warn-bg p-4">
          <FastForward aria-hidden className="size-5 shrink-0 text-cic-warn" />
          <p className="min-w-48 flex-1 font-bold text-cic-darker">
            Come back to {skippedActivities(progress, mod).length === 1 ? "this" : "these"} when you&apos;re ready —{" "}
            {skippedActivities(progress, mod)
              .map((a) => a.title)
              .join(" · ")}
          </p>
        </div>
      )}

      {reviewing ? (
        <div key={`review-${reviewing.id}-${reviewMode}-${redoCount}`} className="mt-6 animate-rise">
          <div role="status" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-cic-tint p-4">
            {reviewMode === "redo" ? (
              <p className="font-bold text-cic-darker">
                Redoing for real — your best score is kept, so a worse try can&apos;t hurt you.
              </p>
            ) : (
              <p className="font-bold text-cic-darker">
                Looking back at a finished activity{progress.results[reviewing.id]?.score !== undefined && (
                  <> · best score {Math.round((progress.results[reviewing.id].score ?? 0) * 100)}%</>
                )}
                . Nothing here changes your saved work.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {reviewMode === "look" ? (
                <Button onClick={() => startRedo(reviewing)}>
                  <RotateCcw aria-hidden className="size-5" /> Redo this activity
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => setReviewMode("look")}>
                  Back to looking
                </Button>
              )}
              <Button variant="secondary" onClick={leaveReview}>
                {current ? "Back to where I left off" : "Done reviewing"}
              </Button>
            </div>
          </div>
          <h1 ref={headingRef} tabIndex={-1} className="mb-5 font-display text-2xl text-cic-dark md:text-3xl">
            {reviewing.title}
          </h1>
          {reviewing.kind === "slides" && (
            <SlidesActivity activity={reviewing} onComplete={reviewMode === "redo" ? (c) => completeRedo(reviewing, c) : leaveReview} />
          )}
          {(reviewing.kind === "pretest" || reviewing.kind === "posttest") && (
            <QuizActivity activity={reviewing} onComplete={reviewMode === "redo" ? (c) => completeRedo(reviewing, c) : leaveReview} />
          )}
          {reviewing.kind === "check" && (
            <CheckActivity
              activity={reviewing}
              onComplete={reviewMode === "redo" ? (c) => completeRedo(reviewing, c) : leaveReview}
              onFailedCheck={reviewMode === "redo" ? failedFor(reviewing) : () => {}}
            />
          )}
          {reviewing.kind === "worksheet" && (
            <WorksheetActivity activity={reviewing} onComplete={reviewMode === "redo" ? (c) => completeRedo(reviewing, c) : leaveReview} />
          )}
          {reviewing.kind === "code" && (
            <CodeActivity
              activity={reviewing}
              onComplete={reviewMode === "redo" ? (c) => completeRedo(reviewing, c) : leaveReview}
              onFailedCheck={reviewMode === "redo" ? failedFor(reviewing) : () => {}}
            />
          )}
          {reviewing.kind === "exit" && (
            <ExitActivity activity={reviewing} onComplete={reviewMode === "redo" ? (c) => completeRedo(reviewing, c) : leaveReview} />
          )}
        </div>
      ) : current ? (
        <div key={current.id} className="mt-6 animate-rise">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <h1 ref={headingRef} tabIndex={-1} className="font-display text-2xl text-cic-dark md:text-3xl">
              {current.title}
            </h1>
            <ActivityTimer secs={timer.secs} estimate={current.minutes} />
          </div>
          {isSkipped(progress, current.id) && (
            <div role="status" className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-dashed border-cic-warn bg-cic-warn-bg p-4">
              <p className="min-w-48 flex-1 font-bold text-cic-darker">
                You skipped this — no pressure. It still counts as not done.
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  unskipActivity(cls.id, student.id, current.id);
                  window.scrollTo({ top: 0 });
                }}
              >
                <Undo2 aria-hidden className="size-5" /> Put it back in my path
              </Button>
            </div>
          )}
          {current.kind === "slides" && <SlidesActivity key={current.id} activity={current} onComplete={complete} />}
          {(current.kind === "pretest" || current.kind === "posttest") && <QuizActivity key={current.id} activity={current} onComplete={complete} />}
          {current.kind === "check" && <CheckActivity key={current.id} activity={current} onComplete={complete} onFailedCheck={failed} />}
          {current.kind === "worksheet" && <WorksheetActivity key={current.id} activity={current} onComplete={complete} />}
          {current.kind === "code" && <CodeActivity key={current.id} activity={current} onComplete={complete} onFailedCheck={failed} />}
          {current.kind === "exit" && <ExitActivity key={current.id} activity={current} onComplete={complete} />}
          {!isSkipped(progress, current.id) && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="ghost"
                onClick={() => {
                  skipActivity(cls.id, student.id, current.id);
                  window.scrollTo({ top: 0 });
                }}
              >
                <FastForward aria-hidden className="size-5" /> Skip for now — I&apos;ll come back
              </Button>
            </div>
          )}
        </div>
      ) : (
        <section className="relative mt-6 animate-rise overflow-hidden rounded-[24px] bg-cic-dark p-6 text-white shadow-slab md:p-10">
          {justFinished && <Confetti />}
          <Brackets className="pointer-events-none absolute -right-12 -bottom-10 w-80 text-cic-green opacity-40" />
          <div role="status" className="relative text-center">
            <PartyPopper aria-hidden className="mx-auto size-14 animate-pop" />
            <h1 className="mt-3 font-display text-3xl leading-tight md:text-5xl">
              {justFinished ? "Congratulations!" : `You've finished Module ${mod.number}`}
            </h1>
            <p className="mx-auto mt-2 max-w-prose text-lg text-cic-tint">
              {justFinished ? `You finished Module ${mod.number}: ${mod.title}. ` : ""}+{mod.activities.length * 10} XP earned.
            </p>
            <p className="mt-1 text-cic-tint">Want to look back? Tap any step above to review it.</p>
          </div>
          {gain.gain !== null && (
            <div className="stagger relative mx-auto mt-6 grid max-w-2xl gap-3 text-black sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-4 text-center shadow-slab">
                <p className="text-sm font-bold text-cic-muted">Warm-up</p>
                <p className="font-display text-3xl">{pct(gain.pre)}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 text-center shadow-slab">
                <p className="text-sm font-bold text-cic-muted">Wrap-up</p>
                <p className="font-display text-3xl">{pct(gain.post)}</p>
              </div>
              <div className="rounded-2xl bg-cic-darker p-4 text-center text-white shadow-[0_4px_0_#003d1f]">
                <p className="flex items-center justify-center gap-1 text-sm font-bold">
                  <TrendingUp aria-hidden className="size-4" /> Learning gain
                </p>
                <p className="font-display text-3xl">{signedPct(gain.gain)}</p>
              </div>
            </div>
          )}
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            {nextModule ? (
              <LinkButton href={`/learn/lesson/${nextModule.id}`} variant="light" className="text-lg">
                Start Module {nextModule.number}: {nextModule.title} <ArrowRight aria-hidden className="size-5" />
              </LinkButton>
            ) : (
              <LinkButton href="/learn/results" variant="light" className="text-lg">
                See my growth <ArrowRight aria-hidden className="size-5" />
              </LinkButton>
            )}
            <LinkButton href="/learn/results" variant="ghost" className="text-white hover:bg-cic-darker">
              My progress
            </LinkButton>
          </div>
        </section>
      )}
    </div>
  );
}
