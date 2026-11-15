"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, ExternalLink, Eye, Layers, ShieldCheck, Timer } from "lucide-react";
import { Card, HeroPanel, Minutes, PageTitle } from "@/components/ui";
import { useCourses } from "@/lib/repo";
import { CONCEPT_LABELS, STAGE_LABELS, type Activity, type ConceptTag } from "@/lib/types";

function questionsOf(a: Activity) {
  return "questions" in a ? a.questions : [];
}

export default function ReviewOverview() {
  const course = useCourses()[0];
  const activities = course.modules.flatMap((m) => m.activities);
  const minutes = activities.reduce((n, a) => n + a.minutes, 0);
  const questions = activities.flatMap(questionsOf).length;
  const codeTasks = activities.filter((a) => a.kind === "code").length;

  // How many quiz questions and code tasks touch each concept.
  const coverage = new Map<ConceptTag, number>();
  for (const a of activities) {
    for (const q of questionsOf(a)) coverage.set(q.concept, (coverage.get(q.concept) ?? 0) + 1);
    if (a.kind === "code" || a.kind === "exit") coverage.set(a.concept, (coverage.get(a.concept) ?? 0) + 1);
  }
  const concepts = [...coverage.entries()].sort((a, b) => b[1] - a[1]);
  const maxCover = Math.max(1, ...concepts.map(([, n]) => n));
  const flow = [...new Set(course.modules[0].activities.map((a) => a.kind))];

  return (
    <div>
      <HeroPanel className="mb-6">
        <p className="flex items-center gap-2 font-bold text-cic-tint">
          <Eye aria-hidden className="size-5" /> Curriculum review
        </p>
        <h1 className="mt-1 font-display text-3xl md:text-4xl">{course.title}</h1>
        <p className="mt-2 max-w-prose text-cic-tint">{course.description}</p>
        <p className="mt-3 flex items-center gap-2 text-sm">
          <ShieldCheck aria-hidden className="size-5" /> Read-only. No student data, no changes.
        </p>
      </HeroPanel>

      <ul className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { Icon: Layers, label: "Modules", value: course.modules.length },
          { Icon: Timer, label: "Student time", value: `~${minutes} min` },
          { Icon: BookOpenCheck, label: "Quiz questions", value: questions },
          { Icon: Eye, label: "Python tasks", value: codeTasks },
        ].map(({ Icon, label, value }) => (
          <li key={label}>
            <Card className="flex h-full items-center gap-3 p-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cic-dark text-white shadow-slab">
                <Icon aria-hidden className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-cic-muted">{label}</p>
                <p className="font-display text-2xl">{value}</p>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <PageTitle title="Modules" subtitle={course.level} />
      <ol className="mb-8 grid gap-4 md:grid-cols-2">
        {course.modules.map((m) => (
          <li key={m.id}>
            <Link
              href={`/review/module/${m.id}`}
              className="group flex h-full flex-col rounded-[var(--radius-card)] border-2 border-cic-line bg-white p-5 shadow-slab-gray transition-colors hover:border-cic-dark hover:bg-cic-tint"
            >
              <span className="text-sm font-bold text-cic-dark">Module {m.number}</span>
              <span className="text-xl font-bold">{m.title}</span>
              <span className="mt-1 flex-1 text-cic-muted">{m.summary}</span>
              <span className="mt-3 flex items-center justify-between text-sm">
                <span>
                  {m.activities.length} activities · <Minutes n={m.activities.reduce((n, a) => n + a.minutes, 0)} />
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-cic-dark">
                  Review <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold text-cic-dark">How each module flows</h2>
          <ol className="mt-3 flex flex-wrap items-center gap-2">
            {flow.map((k, i) => (
              <li key={k} className="flex items-center gap-2">
                <span className="rounded-full bg-cic-tint px-3 py-1 text-sm font-bold text-cic-darker">{STAGE_LABELS[k]}</span>
                {i < flow.length - 1 && <ArrowRight aria-hidden className="size-4 text-cic-muted" />}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-cic-muted">
            Each module opens with a warm-up quiz and closes with a wrap-up quiz on the same concepts. The difference is the
            student&apos;s learning gain. Hints guide students without giving the answer.
          </p>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-cic-dark">Concepts covered</h2>
          <ul className="mt-3 space-y-2">
            {concepts.map(([c, n]) => (
              <li key={c} className="flex items-center gap-3 text-sm">
                <span className="w-40 shrink-0 font-bold">{CONCEPT_LABELS[c]}</span>
                <span className="h-3 flex-1 overflow-hidden rounded-full bg-cic-tint ring-1 ring-cic-line ring-inset" aria-hidden>
                  <span className="block h-full rounded-full bg-cic-green" style={{ width: `${(n / maxCover) * 100}%` }} />
                </span>
                <span className="w-24 shrink-0 text-right text-cic-muted">{n} item{n === 1 ? "" : "s"}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-xl font-bold text-cic-dark">Want to try it with your own class?</h2>
        <p className="mt-1 text-cic-muted">
          Reviewer accounts are read-only. If you&apos;d like to run this course with your students, ask the Coding in Color team to turn on teacher
          access for your account. Your students then join with a class code, with no email or passwords.
        </p>
      </Card>

      <Card className="mt-6">
        <h2 className="text-xl font-bold text-cic-dark">Source material</h2>
        <ul className="mt-2 space-y-1">
          {course.resources.map((r) => (
            <li key={r.href}>
              <a href={r.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 font-bold text-cic-dark underline underline-offset-2">
                {r.label} <ExternalLink aria-hidden className="size-4" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
