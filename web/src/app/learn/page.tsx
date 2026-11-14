"use client";

import { ArrowRight, BookOpen, CheckCircle2, Flame, PartyPopper, Star, Users } from "lucide-react";
import { Card, LinkButton, Loading, Minutes, ProgressBar } from "@/components/ui";
import { courseProgress, moduleComplete, moduleDoneCount, nextStep } from "@/lib/analytics";
import { getClassProgress } from "@/lib/repo";
import { STAGE_LABELS } from "@/lib/types";
import { useStudent } from "@/lib/use-student";

export default function StudentHome() {
  const ctx = useStudent();
  if (!ctx) return <Loading />;
  const { student, cls, course, modules, progress, xp } = ctx;

  const next = nextStep(progress, modules);
  const started = Object.keys(progress.results).length > 0;
  const overall = courseProgress(progress, modules);

  // Where is most of the class? Shown to reassure late joiners.
  const classmates = Object.values(getClassProgress(cls)).filter((p) => p.studentId !== student.id);
  const positions = classmates
    .map((p) => nextStep(p, modules)?.module.number ?? modules.length)
    .sort((a, b) => a - b);
  const classModule = positions.length ? positions[Math.floor(positions.length / 2)] : 1;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold text-cic-dark">Hi, {student.firstName}!</h1>
      <p className="mt-1 text-cic-muted">{started ? "Ready to keep going?" : "Welcome to your class."}</p>

      {next && !started && (
        <section aria-labelledby="start-here" className="mt-6 rounded-[var(--radius-card)] border-2 border-cic-dark bg-cic-tint p-5">
          <h2 id="start-here" className="text-xl font-bold text-cic-darker">
            Start here
          </h2>
          <p className="mt-1">
            {classModule > 1 ? `Most of your class is around Module ${classModule}, and that's okay. ` : ""}
            Every lesson teaches itself. Start with{" "}
            <strong>
              Module {next.module.number}: {next.activity.title}
            </strong>{" "}
            and go at your own pace — you can catch up without your teacher re-teaching anything.
          </p>
          <LinkButton href={`/learn/lesson/${next.module.id}`} className="mt-4">
            Start Module {next.module.number} <ArrowRight aria-hidden className="size-5" />
          </LinkButton>
        </section>
      )}

      {next && started && (
        <Card className="mt-6 border-2 border-cic-dark">
          <h2 className="text-lg font-bold">Continue learning</h2>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-cic-tint text-cic-dark">
              <BookOpen aria-hidden className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">
                Module {next.module.number}: {next.module.title}
              </p>
              <p className="text-cic-muted">
                Next up: {STAGE_LABELS[next.activity.kind]} — {next.activity.title}
              </p>
              <ProgressBar
                className="mt-2"
                value={moduleDoneCount(progress, next.module) / next.module.activities.length}
                label={`Module ${next.module.number} progress`}
              />
            </div>
            <LinkButton href={`/learn/lesson/${next.module.id}`}>
              Continue <ArrowRight aria-hidden className="size-5" />
            </LinkButton>
          </div>
        </Card>
      )}

      {!next && (
        <Card className="mt-6 border-2 border-cic-dark bg-cic-tint">
          <PartyPopper aria-hidden className="size-8 text-cic-dark" />
          <h2 className="mt-2 text-xl font-bold">You finished the course!</h2>
          <p className="mt-1">See how much you grew on your progress page.</p>
          <LinkButton href="/learn/results" className="mt-4">
            See my growth
          </LinkButton>
        </Card>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <Flame aria-hidden className="size-6 text-cic-warn" />
          <p className="mt-2 text-2xl font-bold">
            {progress.streakDays} day{progress.streakDays === 1 ? "" : "s"}
          </p>
          <p className="text-sm text-cic-muted">Learning streak</p>
        </Card>
        <Card className="p-4">
          <Star aria-hidden className="size-6 text-cic-dark" />
          <p className="mt-2 text-2xl font-bold">{xp} XP</p>
          <p className="text-sm text-cic-muted">10 XP for every activity</p>
        </Card>
        <Card className="p-4">
          <CheckCircle2 aria-hidden className="size-6 text-cic-dark" />
          <p className="mt-2 text-2xl font-bold">{Math.round(overall * 100)}%</p>
          <p className="text-sm text-cic-muted">of {course.title}</p>
        </Card>
      </div>

      <h2 className="mt-8 text-xl font-bold">My class</h2>
      <Card className="mt-3 flex flex-wrap items-center gap-4">
        <Users aria-hidden className="size-6 text-cic-dark" />
        <div className="flex-1">
          <p className="font-bold">
            {cls.name} · {cls.school}
          </p>
          <p className="text-sm text-cic-muted">
            {course.title} · {modules.filter((m) => moduleComplete(progress, m)).length} of {modules.length} modules done
          </p>
        </div>
        <LinkButton href="/learn/course" variant="secondary">
          View course map
        </LinkButton>
      </Card>

      {next && (
        <>
          <h2 className="mt-8 text-xl font-bold">Up next in Module {next.module.number}</h2>
          <ol className="mt-3 space-y-2">
            {next.module.activities.slice(next.activityIndex, next.activityIndex + 3).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-cic-line px-4 py-3">
                <span>
                  <span className="font-bold">{STAGE_LABELS[a.kind]}:</span> {a.title}
                </span>
                <Minutes n={a.minutes} />
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
