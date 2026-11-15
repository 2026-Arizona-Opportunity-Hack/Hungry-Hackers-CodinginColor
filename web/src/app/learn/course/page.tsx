"use client";

import Link from "next/link";
import { Check, ChevronRight, Lock } from "lucide-react";
import { HeroPanel, Loading, ProgressBar, cx } from "@/components/ui";
import { STAGE_ICONS } from "@/components/stage-icon";
import { moduleComplete, moduleDoneCount, moduleUnlocked } from "@/lib/analytics";
import { useStudent } from "@/lib/use-student";

export default function CourseRoadmap() {
  const ctx = useStudent();
  if (!ctx) return <Loading />;
  const { course, modules, progress } = ctx;
  const minutes = modules.flatMap((m) => m.activities).reduce((s, a) => s + a.minutes, 0);

  return (
    <div className="mx-auto max-w-3xl">
      <HeroPanel>
        <p className="font-bold text-cic-tint">
          {course.level}, {modules.length} modules, about {Math.round(minutes / 60)} hours
        </p>
        <h1 className="mt-1 font-display text-3xl leading-tight md:text-4xl">{course.title}</h1>
        <p className="mt-2 max-w-prose text-cic-tint">{course.description}</p>
      </HeroPanel>

      {/* The path: one node per module, joined by a line that fills in as you go. */}
      <ol aria-label="Course modules" className="relative mt-10">
        {modules.map((m, i) => {
          const done = moduleComplete(progress, m);
          const open = moduleUnlocked(progress, modules, i);
          const count = moduleDoneCount(progress, m);
          const current = open && !done;
          const state = done ? "Complete" : current ? (count > 0 ? "In progress" : "Ready to start") : "Locked";
          const last = i === modules.length - 1;

          const card = (
            <div
              className={cx(
                "rounded-[var(--radius-card)] border-2 bg-white p-5 transition-transform",
                current ? "border-cic-dark shadow-slab" : "border-cic-line shadow-slab-gray",
                open && "group-hover:-translate-y-0.5",
                !open && "opacity-75",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={cx("text-sm font-bold", current ? "text-cic-dark" : "text-cic-muted")}>
                    Module {m.number}: {state}
                  </p>
                  <h2 className="mt-0.5 text-xl font-bold">{m.title}</h2>
                </div>
                {open && <ChevronRight aria-hidden className="mt-1 size-6 shrink-0 text-cic-dark" />}
              </div>
              <p className="mt-1 text-cic-muted">{m.summary}</p>
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Activities">
                {m.activities.map((a, ai) => {
                  const Icon = STAGE_ICONS[a.kind];
                  const isDone = ai < count;
                  return (
                    <li
                      key={a.id}
                      title={a.title}
                      className={cx(
                        "grid size-8 place-items-center rounded-lg",
                        isDone ? "bg-cic-green text-white" : "bg-cic-tint text-cic-dark",
                      )}
                    >
                      <Icon aria-hidden className="size-4" />
                      <span className="sr-only">
                        {a.title} {isDone ? "(done)" : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {current && count > 0 && (
                <ProgressBar className="mt-3" value={count / m.activities.length} label={`Module ${m.number}: ${count} of ${m.activities.length} activities`} />
              )}
            </div>
          );

          return (
            <li key={m.id} className="relative flex gap-4 pb-8 last:pb-0 md:gap-6">
              {!last && (
                <span
                  aria-hidden
                  className={cx("absolute top-16 bottom-0 left-8 w-2 -translate-x-1/2 rounded-full", done ? "bg-cic-green" : "bg-cic-tint")}
                />
              )}
              <span
                aria-hidden
                className={cx(
                  "relative z-10 grid size-16 shrink-0 place-items-center rounded-full font-display text-2xl",
                  done && "bg-cic-green text-white shadow-[0_4px_0_var(--color-cic-dark)]",
                  current && "animate-pop bg-cic-dark text-white shadow-slab ring-4 ring-cic-tint",
                  !open && "bg-white text-cic-muted ring-4 ring-cic-line ring-inset",
                )}
              >
                {done ? <Check className="size-8" strokeWidth={3} /> : open ? m.number : <Lock className="size-6" />}
              </span>
              <div className="min-w-0 flex-1">
                {open ? (
                  <Link
                    href={`/learn/lesson/${m.id}`}
                    aria-label={`Module ${m.number}: ${m.title}, ${state}`}
                    className="group block rounded-[var(--radius-card)]"
                  >
                    {card}
                  </Link>
                ) : (
                  <div aria-label={`Module ${m.number}: ${m.title}, locked until Module ${m.number - 1} is complete`}>{card}</div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
