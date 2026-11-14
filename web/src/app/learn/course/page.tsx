"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight, Lock, PlayCircle } from "lucide-react";
import { Loading, PageTitle, ProgressBar, cx } from "@/components/ui";
import { moduleComplete, moduleDoneCount, moduleUnlocked } from "@/lib/analytics";
import { useStudent } from "@/lib/use-student";

export default function CourseRoadmap() {
  const ctx = useStudent();
  if (!ctx) return <Loading />;
  const { course, modules, progress } = ctx;
  const minutes = modules.flatMap((m) => m.activities).reduce((s, a) => s + a.minutes, 0);

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle
        title={course.title}
        subtitle={`${course.level} · ${modules.length} modules · about ${Math.round(minutes / 60)} hours`}
      />
      <p className="-mt-2 mb-6 max-w-prose">{course.description}</p>

      <ol aria-label="Course modules" className="stagger relative space-y-4">
        {modules.map((m, i) => {
          const done = moduleComplete(progress, m);
          const open = moduleUnlocked(progress, modules, i);
          const count = moduleDoneCount(progress, m);
          const inProgress = open && !done;
          const state = done ? "Complete" : inProgress ? (count > 0 ? "In progress" : "Ready to start") : "Locked";
          const Icon = done ? CheckCircle2 : open ? PlayCircle : Lock;

          const body = (
            <div
              className={cx(
                "flex items-center gap-4 rounded-[var(--radius-card)] border-2 p-4",
                inProgress ? "border-cic-dark bg-cic-tint" : "border-cic-line bg-white",
                open && "hover:border-cic-dark",
              )}
            >
              <span
                className={cx(
                  "grid size-12 shrink-0 place-items-center rounded-full",
                  done ? "bg-cic-green text-white" : open ? "bg-cic-dark text-white" : "bg-white text-cic-muted ring-2 ring-cic-line",
                )}
              >
                <Icon aria-hidden className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-cic-muted">Module {m.number}</p>
                <h2 className="text-lg font-bold">{m.title}</h2>
                <p className="text-sm text-cic-muted">{m.summary}</p>
                {open && (
                  <ProgressBar className="mt-2" value={count / m.activities.length} label={`Module ${m.number}: ${count} of ${m.activities.length} activities`} />
                )}
              </div>
              <span className="hidden shrink-0 text-sm font-bold sm:block">{state}</span>
              {open && <ChevronRight aria-hidden className="size-5 shrink-0 text-cic-dark" />}
            </div>
          );

          return (
            <li key={m.id}>
              {open ? (
                <Link href={`/learn/lesson/${m.id}`} aria-label={`Module ${m.number}: ${m.title} — ${state}`} className="block rounded-[var(--radius-card)]">
                  {body}
                </Link>
              ) : (
                <div aria-label={`Module ${m.number}: ${m.title} — locked until Module ${m.number - 1} is complete`}>{body}</div>
              )}
            </li>
          );
        })}
      </ol>

      <section className="mt-10" aria-labelledby="more">
        <h2 id="more" className="text-xl font-bold">
          Keep learning
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-6">
          {course.resources.map((r) => (
            <li key={r.href}>
              <a href={r.href} target="_blank" rel="noreferrer" className="font-bold text-cic-dark underline underline-offset-2">
                {r.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
