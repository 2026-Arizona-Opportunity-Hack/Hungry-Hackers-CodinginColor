"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, Lightbulb } from "lucide-react";
import { Button, Card, EmptyState, LinkButton, Minutes, PageTitle } from "@/components/ui";
import { useCourses } from "@/lib/repo";
import { CONCEPT_LABELS, STAGE_LABELS, type Activity, type ChoiceQuestion } from "@/lib/types";

function Questions({ qs }: { qs: ChoiceQuestion[] }) {
  return (
    <ol className="space-y-5">
      {qs.map((q, n) => (
        <li key={q.id}>
          <p className="font-bold">
            {n + 1}. {q.prompt}
          </p>
          <p className="mt-0.5 text-xs font-bold text-cic-muted">Concept: {CONCEPT_LABELS[q.concept]}</p>
          {q.code && <pre className="mt-2 overflow-x-auto rounded-xl bg-black p-3 text-sm text-white">{q.code}</pre>}
          <ul className="mt-2 space-y-1">
            {q.choices.map((c, i) => (
              <li key={c} className={i === q.answerIndex ? "flex items-start gap-2 rounded-lg bg-cic-tint p-2 font-bold text-cic-darker" : "p-2"}>
                {i === q.answerIndex ? <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0" /> : <span aria-hidden className="size-5 shrink-0" />}
                <span>
                  {c}
                  {i === q.answerIndex && <span className="sr-only"> (correct answer)</span>}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 flex items-start gap-2 text-sm">
            <Lightbulb aria-hidden className="mt-0.5 size-4 shrink-0 text-cic-warn" />
            <span>
              <strong>Hint after a wrong answer:</strong> {q.hint}
            </span>
          </p>
          <p className="mt-1 text-sm">
            <strong>Explanation:</strong> {q.explanation}
          </p>
        </li>
      ))}
    </ol>
  );
}

function Detail({ a }: { a: Activity }) {
  switch (a.kind) {
    case "pretest":
    case "posttest":
    case "check":
      return <Questions qs={a.questions} />;
    case "slides":
      return (
        <ol className="space-y-4">
          {a.slides.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-cic-line p-3">
              <p className="font-bold">
                Slide {i + 1}: {s.title}
              </p>
              {s.bullets.length > 0 && (
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
              {s.ourProject && (
                <p className="mt-2 rounded-lg bg-cic-tint p-2 text-sm">
                  <strong>Our project:</strong> {s.ourProject}
                </p>
              )}
            </li>
          ))}
        </ol>
      );
    case "worksheet":
      return (
        <div>
          <p>{a.intro}</p>
          {a.link && (
            <a href={a.link.href} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-1 font-bold text-cic-dark underline underline-offset-2">
              {a.link.label} <ExternalLink aria-hidden className="size-4" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {a.fields.map((f) => (
              <li key={f.id}>
                <strong>{f.label}</strong>
                {f.help && <span className="text-cic-muted"> — {f.help}</span>}
              </li>
            ))}
          </ul>
        </div>
      );
    case "code":
      return (
        <div className="space-y-3">
          <p className="text-xs font-bold text-cic-muted">Concept: {CONCEPT_LABELS[a.concept]}</p>
          <ol className="list-decimal space-y-1 pl-5">
            {a.instructions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <div>
            <p className="font-bold">Starter code</p>
            <pre className="mt-1 overflow-x-auto rounded-xl bg-black p-3 text-sm text-white">{a.starter}</pre>
          </div>
          {a.exampleOutput && (
            <div>
              <p className="font-bold">Example output</p>
              <pre className="mt-1 overflow-x-auto rounded-xl bg-cic-tint p-3 text-sm">{a.exampleOutput}</pre>
            </div>
          )}
          <div>
            <p className="font-bold">Automatic tests</p>
            <ul className="mt-1 list-disc pl-5">
              {a.tests.map((t) => (
                <li key={t.description}>
                  {t.description} <code className="rounded bg-cic-tint px-1">{t.expr} == {t.expected}</code>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-bold">Hint ladder (revealed one at a time)</p>
            <ol className="mt-1 list-decimal space-y-1 pl-5">
              {a.hints.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ol>
          </div>
        </div>
      );
    case "exit":
      return (
        <div>
          <p className="text-xs font-bold text-cic-muted">Concept: {CONCEPT_LABELS[a.concept]}</p>
          <p className="mt-1">{a.prompt}</p>
        </div>
      );
  }
}

export default function ModuleReview() {
  const course = useCourses()[0];
  const { moduleId } = useParams<{ moduleId: string }>();
  const [allOpen, setAllOpen] = useState(false);
  const index = course.modules.findIndex((m) => m.id === moduleId);
  if (index === -1) {
    return (
      <EmptyState title="Module not found" action={<LinkButton href="/review">Back to overview</LinkButton>}>
        That module doesn&apos;t exist in this course.
      </EmptyState>
    );
  }
  const m = course.modules[index];
  const prev = course.modules[index - 1];
  const next = course.modules[index + 1];

  return (
    <div>
      <nav aria-label="Modules" className="mb-4">
        <ul className="flex flex-wrap gap-2">
          {course.modules.map((x) => (
            <li key={x.id}>
              <Link
                href={`/review/module/${x.id}`}
                aria-current={x.id === m.id ? "page" : undefined}
                className={
                  x.id === m.id
                    ? "inline-flex min-h-11 items-center rounded-full bg-cic-dark px-4 font-bold text-white shadow-slab"
                    : "inline-flex min-h-11 items-center rounded-full border-2 border-cic-line px-4 font-bold text-cic-dark hover:bg-cic-tint"
                }
              >
                {x.number}. {x.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <PageTitle
        title={`Module ${m.number}: ${m.title}`}
        subtitle={m.summary}
        actions={
          <Button variant="secondary" onClick={() => setAllOpen((o) => !o)} aria-pressed={allOpen}>
            {allOpen ? "Collapse all" : "Expand all"}
          </Button>
        }
      />

      <ol className="space-y-3">
        {m.activities.map((a, i) => (
          <li key={`${a.id}-${allOpen}`}>
            <Card className="p-0">
              <details open={allOpen} className="group">
                <summary className="flex min-h-14 cursor-pointer flex-wrap items-center justify-between gap-2 p-4">
                  <span>
                    <span className="mr-2 text-sm font-bold text-cic-muted">{i + 1}.</span>
                    <span className="mr-2 rounded-full bg-cic-tint px-2 py-0.5 text-xs font-bold text-cic-darker">{STAGE_LABELS[a.kind]}</span>
                    <span className="font-bold">{a.title}</span>
                  </span>
                  <Minutes n={a.minutes} />
                </summary>
                <div className="border-t border-cic-line p-4">
                  <Detail a={a} />
                </div>
              </details>
            </Card>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-wrap justify-between gap-3">
        {prev ? (
          <LinkButton href={`/review/module/${prev.id}`} variant="secondary">
            <ArrowLeft aria-hidden className="size-4" /> Module {prev.number}
          </LinkButton>
        ) : (
          <span />
        )}
        {next && (
          <LinkButton href={`/review/module/${next.id}`}>
            Module {next.number} <ArrowRight aria-hidden className="size-4" />
          </LinkButton>
        )}
      </div>
    </div>
  );
}
