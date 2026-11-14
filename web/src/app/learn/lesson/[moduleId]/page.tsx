"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, ChevronLeft, Lock, PartyPopper, TrendingUp } from "lucide-react";
import { CheckActivity, ExitActivity, QuizActivity, SlidesActivity, WorksheetActivity, type Completion } from "@/components/activities";
import { CodeActivity } from "@/components/code-activity";
import { Card, LinkButton, Loading, Minutes, cx } from "@/components/ui";
import { isDone, moduleGain, moduleUnlocked, pct, signedPct } from "@/lib/analytics";
import { recordFailedCheck, recordResult } from "@/lib/repo";
import { STAGE_LABELS, type Activity } from "@/lib/types";
import { useStudent } from "@/lib/use-student";

export default function LessonPlayer() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const ctx = useStudent();
  const startedAt = useRef(Date.now());
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [justFinished, setJustFinished] = useState(false);

  const mod = ctx?.modules.find((m) => m.id === moduleId);
  const index = mod ? mod.activities.findIndex((a) => !isDone(ctx?.progress, a.id)) : -1;
  const current: Activity | undefined = mod && index !== -1 ? mod.activities[index] : undefined;

  // New activity: reset the timer and move focus to its title.
  useEffect(() => {
    startedAt.current = Date.now();
    if (current) headingRef.current?.focus();
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
      secondsOnTask: Math.round((Date.now() - startedAt.current) / 1000),
      response: c.response,
    });
    if (current.kind === "posttest") setJustFinished(true);
    window.scrollTo({ top: 0 });
  }

  const failed = () => current && recordFailedCheck(cls.id, student.id, current.id);
  const nextModule = modules[modIndex + 1];
  const gain = moduleGain(progress, mod);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/learn/course" className="inline-flex min-h-11 items-center gap-1 font-bold text-cic-dark">
        <ChevronLeft aria-hidden className="size-5" /> Course map
      </Link>
      <p className="mt-2 text-sm font-bold text-cic-muted">
        Module {mod.number} of {modules.length}
      </p>
      <p className="text-2xl font-bold">{mod.title}</p>

      {/* Stage stepper */}
      <ol aria-label="Lesson steps" className="mt-4 flex gap-1 overflow-x-auto pb-2">
        {mod.activities.map((a, i) => {
          const done = isDone(progress, a.id);
          const now = i === index;
          return (
            <li key={a.id} aria-current={now ? "step" : undefined} className="min-w-24 flex-1">
              <div className={cx("h-2 rounded-full", done ? "bg-cic-green" : now ? "bg-cic-dark" : "bg-cic-tint ring-1 ring-cic-line ring-inset")} />
              <p className={cx("mt-1 flex items-center gap-1 text-xs font-bold", now ? "text-cic-dark" : "text-cic-muted")}>
                {done && <Check aria-hidden className="size-3.5" />}
                {STAGE_LABELS[a.kind]}
                <span className="sr-only">{done ? " — done" : now ? " — current step" : " — not started"}</span>
              </p>
            </li>
          );
        })}
      </ol>

      {current ? (
        <div className="mt-6">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold text-cic-dark md:text-3xl">
              {current.title}
            </h1>
            <Minutes n={current.minutes} />
          </div>
          {current.kind === "slides" && <SlidesActivity key={current.id} activity={current} onComplete={complete} />}
          {(current.kind === "pretest" || current.kind === "posttest") && <QuizActivity key={current.id} activity={current} onComplete={complete} />}
          {current.kind === "check" && <CheckActivity key={current.id} activity={current} onComplete={complete} onFailedCheck={failed} />}
          {current.kind === "worksheet" && <WorksheetActivity key={current.id} activity={current} onComplete={complete} />}
          {current.kind === "code" && <CodeActivity key={current.id} activity={current} onComplete={complete} onFailedCheck={failed} />}
          {current.kind === "exit" && <ExitActivity key={current.id} activity={current} onComplete={complete} />}
        </div>
      ) : (
        <Card className="mt-6 border-2 border-cic-dark">
          <div role="status">
            <PartyPopper aria-hidden className="size-10 text-cic-dark" />
            <h1 className="mt-2 text-2xl font-bold text-cic-dark">
              {justFinished ? `Module ${mod.number} complete!` : `You've finished Module ${mod.number}`}
            </h1>
            <p className="mt-1">+{mod.activities.length * 10} XP earned in this module.</p>
          </div>
          {gain.gain !== null && (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-cic-tint p-4">
                <p className="text-sm text-cic-muted">Warm-up</p>
                <p className="text-2xl font-bold">{pct(gain.pre)}</p>
              </div>
              <div className="rounded-xl bg-cic-tint p-4">
                <p className="text-sm text-cic-muted">Wrap-up</p>
                <p className="text-2xl font-bold">{pct(gain.post)}</p>
              </div>
              <div className="rounded-xl bg-cic-dark p-4 text-white">
                <p className="flex items-center gap-1 text-sm">
                  <TrendingUp aria-hidden className="size-4" /> Your learning gain
                </p>
                <p className="text-2xl font-bold">{signedPct(gain.gain)}</p>
              </div>
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            {nextModule ? (
              <LinkButton href={`/learn/lesson/${nextModule.id}`}>
                Start Module {nextModule.number}: {nextModule.title} <ArrowRight aria-hidden className="size-5" />
              </LinkButton>
            ) : (
              <LinkButton href="/learn/results">
                See my growth <ArrowRight aria-hidden className="size-5" />
              </LinkButton>
            )}
            <LinkButton href="/learn/results" variant="secondary">
              My progress
            </LinkButton>
          </div>
        </Card>
      )}
    </div>
  );
}
