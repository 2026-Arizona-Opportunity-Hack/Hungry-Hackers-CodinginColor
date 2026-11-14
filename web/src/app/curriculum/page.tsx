import Link from "next/link";
import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { Logo, Minutes } from "@/components/ui";
import { introAiCourse } from "@/lib/curriculum/intro-ai";
import { CONCEPT_LABELS, STAGE_LABELS, type Activity } from "@/lib/types";

export const metadata: Metadata = {
  title: "Curriculum catalog · Coding in Color",
  description: "Read-only view of every module, activity and quiz question. No student data.",
};

function activityDetail(a: Activity): string {
  switch (a.kind) {
    case "pretest":
    case "posttest":
      return `${a.questions.length} questions`;
    case "slides":
      return `${a.slides.length} slides`;
    case "check":
      return `${a.questions.length} question${a.questions.length === 1 ? "" : "s"} with hints`;
    case "worksheet":
      return `${a.fields.length} prompts`;
    case "code":
      return `Python in the browser · ${a.tests.length} automatic tests`;
    case "exit":
      return CONCEPT_LABELS[a.concept];
  }
}

export default function Curriculum() {
  const course = introAiCourse;
  const total = course.modules.reduce((n, m) => n + m.activities.reduce((k, a) => k + a.minutes, 0), 0);

  return (
    <div className="min-h-dvh">
      <header className="border-b-2 border-cic-dark bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" aria-label="Coding in Color home">
            <Logo className="h-9 w-auto" />
          </Link>
          <span className="rounded-full bg-cic-tint px-3 py-1 text-sm font-bold text-cic-darker">Reviewer view · read only</span>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-8">
        <p className="font-bold text-cic-dark">{course.level}</p>
        <h1 className="text-3xl font-bold text-cic-dark">{course.title}</h1>
        <p className="mt-2 max-w-prose text-cic-muted">{course.description}</p>
        <p className="mt-2 text-sm text-cic-muted">
          {course.modules.length} modules · about {total} minutes of student work · built from the Coding in Color “Intro to Artificial
          Intelligence” deck.
        </p>

        <nav aria-label="Modules" className="mt-6">
          <ul className="flex flex-wrap gap-2">
            {course.modules.map((m) => (
              <li key={m.id}>
                <a href={`#${m.id}`} className="inline-flex min-h-11 items-center rounded-full border-2 border-cic-line px-4 font-bold text-cic-dark hover:bg-cic-tint">
                  {m.number}. {m.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {course.modules.map((m) => (
          <section key={m.id} id={m.id} aria-labelledby={`${m.id}-h`} className="mt-10 scroll-mt-4">
            <h2 id={`${m.id}-h`} className="text-2xl font-bold">
              Module {m.number}: {m.title}
            </h2>
            <p className="mt-1 text-cic-muted">{m.summary}</p>
            <ol className="mt-4 divide-y divide-cic-line rounded-[var(--radius-card)] border border-cic-line">
              {m.activities.map((a) => (
                <li key={a.id} className="p-4">
                  <details>
                    <summary className="flex min-h-11 cursor-pointer flex-wrap items-center justify-between gap-2">
                      <span>
                        <span className="mr-2 rounded-full bg-cic-tint px-2 py-0.5 text-xs font-bold text-cic-darker">{STAGE_LABELS[a.kind]}</span>
                        <span className="font-bold">{a.title}</span>
                        <span className="ml-2 text-sm text-cic-muted">{activityDetail(a)}</span>
                      </span>
                      <Minutes n={a.minutes} />
                    </summary>
                    <div className="mt-3 text-sm">
                      {(a.kind === "pretest" || a.kind === "posttest") && (
                        <ol className="list-decimal space-y-2 pl-5">
                          {a.questions.map((q) => (
                            <li key={q.id}>
                              {q.prompt}
                              <ul className="mt-1 list-disc pl-5 text-cic-muted">
                                {q.choices.map((c, i) => (
                                  <li key={c}>
                                    {c}
                                    {i === q.answerIndex && <strong className="text-cic-darker"> (answer)</strong>}
                                  </li>
                                ))}
                              </ul>
                            </li>
                          ))}
                        </ol>
                      )}
                      {a.kind === "slides" && (
                        <ol className="list-decimal space-y-1 pl-5">
                          {a.slides.map((s) => (
                            <li key={s.title}>{s.title}</li>
                          ))}
                        </ol>
                      )}
                      {a.kind === "check" && a.questions.map((q) => <p key={q.id}>{q.prompt}</p>)}
                      {a.kind === "worksheet" && (
                        <ul className="list-disc pl-5">
                          {a.fields.map((f) => (
                            <li key={f.id}>{f.label}</li>
                          ))}
                        </ul>
                      )}
                      {a.kind === "code" && <p className="whitespace-pre-line">{a.instructions}</p>}
                      {a.kind === "exit" && <p>{a.prompt}</p>}
                    </div>
                  </details>
                </li>
              ))}
            </ol>
          </section>
        ))}

        <section aria-labelledby="res" className="mt-10">
          <h2 id="res" className="text-2xl font-bold">
            Resources
          </h2>
          <ul className="mt-3 space-y-2">
            {course.resources.map((r) => (
              <li key={r.href}>
                <a href={r.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 font-bold text-cic-dark underline underline-offset-2">
                  {r.label} <ExternalLink aria-hidden className="size-4" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
