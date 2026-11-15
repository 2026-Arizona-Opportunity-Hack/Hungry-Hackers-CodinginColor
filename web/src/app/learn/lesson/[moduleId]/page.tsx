"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, Lock, PartyPopper, Timer, TrendingUp } from "lucide-react";
import { CheckActivity, ExitActivity, QuizActivity, SlidesActivity, WorksheetActivity, type Completion } from "@/components/activities";
import { CodeActivity } from "@/components/code-activity";
import { Confetti } from "@/components/confetti";
import { Brackets, Button, Card, LinkButton, Loading, cx } from "@/components/ui";
import { STAGE_ICONS } from "@/components/stage-icon";
import { isDone, moduleGain, moduleUnlocked, pct, signedPct } from "@/lib/analytics";
import { recordFailedCheck, recordResult } from "@/lib/repo";
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
  // A finished activity the student opened again to look back at. Nothing is saved in review.
  const [reviewId, setReviewId] = useState<string | null>(null);

  const mod = ctx?.modules.find((m) => m.id === moduleId);
  const index = mod ? mod.activities.findIndex((a) => !isDone(ctx?.progress, a.id)) : -1;
  const current: Activity | undefined = mod && index !== -1 ? mod.activities[index] : undefined;
  const timer = useActiveTimer(current?.id);

  // New activity (or opening one to review): move focus to its title.
  useEffect(() => {
    headingRef.current?.focus();
  }, [current?.id, reviewId]);

  // Switching modules leaves review mode.
  useEffect(() => setReviewId(null), [moduleId]);

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
          const now = reviewing ? a.id === reviewing.id : i === index;
          const Icon = done ? Check : STAGE_ICONS[a.kind];
          const step = (
            <>
              <span
                className={cx(
                  "grid size-11 place-items-center rounded-2xl transition-colors duration-500",
                  done && !now && "bg-cic-green text-white",
                  now && "animate-pop bg-cic-dark text-white shadow-slab",
                  !done && !now && "bg-cic-tint text-cic-dark",
                )}
              >
                <Icon aria-hidden className="size-5" strokeWidth={done ? 3 : 2} />
              </span>
              <span className={cx("mt-2 block h-1.5 w-full rounded-full", done ? "bg-cic-green" : now ? "bg-cic-dark" : "bg-cic-tint")} />
              <span className={cx("mt-1 block text-center text-xs font-bold", now ? "text-cic-dark" : "text-cic-muted")}>
                {STAGE_LABELS[a.kind]}
                <span className="sr-only">{now ? " — showing now" : done ? " — done, open to review" : " — not started"}</span>
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

      {reviewing ? (
        <div key={`review-${reviewing.id}`} className="mt-6 animate-rise">
          <div role="status" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-cic-tint p-4">
            <p className="font-bold text-cic-darker">Reviewing a finished activity. Nothing here changes your saved work.</p>
            <Button variant="secondary" onClick={leaveReview}>
              {current ? "Back to where I left off" : "Done reviewing"}
            </Button>
          </div>
          <h1 ref={headingRef} tabIndex={-1} className="mb-5 font-display text-2xl text-cic-dark md:text-3xl">
            {reviewing.title}
          </h1>
          {reviewing.kind === "slides" && <SlidesActivity activity={reviewing} onComplete={leaveReview} />}
          {(reviewing.kind === "pretest" || reviewing.kind === "posttest") && <QuizActivity activity={reviewing} onComplete={leaveReview} />}
          {reviewing.kind === "check" && <CheckActivity activity={reviewing} onComplete={leaveReview} onFailedCheck={() => {}} />}
          {reviewing.kind === "worksheet" && <WorksheetActivity activity={reviewing} onComplete={leaveReview} />}
          {reviewing.kind === "code" && <CodeActivity activity={reviewing} onComplete={leaveReview} onFailedCheck={() => {}} />}
          {reviewing.kind === "exit" && <ExitActivity activity={reviewing} onComplete={leaveReview} />}
        </div>
      ) : current ? (
        <div key={current.id} className="mt-6 animate-rise">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <h1 ref={headingRef} tabIndex={-1} className="font-display text-2xl text-cic-dark md:text-3xl">
              {current.title}
            </h1>
            <ActivityTimer secs={timer.secs} estimate={current.minutes} />
          </div>
          {current.kind === "slides" && <SlidesActivity key={current.id} activity={current} onComplete={complete} />}
          {(current.kind === "pretest" || current.kind === "posttest") && <QuizActivity key={current.id} activity={current} onComplete={complete} />}
          {current.kind === "check" && <CheckActivity key={current.id} activity={current} onComplete={complete} onFailedCheck={failed} />}
          {current.kind === "worksheet" && <WorksheetActivity key={current.id} activity={current} onComplete={complete} />}
          {current.kind === "code" && <CodeActivity key={current.id} activity={current} onComplete={complete} onFailedCheck={failed} />}
          {current.kind === "exit" && <ExitActivity key={current.id} activity={current} onComplete={complete} />}
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
