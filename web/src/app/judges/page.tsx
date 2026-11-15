import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { Logo } from "@/components/ui";
import { DEMO_TEACHER_EMAIL, DEMO_TEACHER_PASSWORD } from "@/lib/demo-accounts";
import { DEMO_CLASS_CODE, DEMO_STUDENT } from "@/lib/demo-data";
import { pictureName } from "@/lib/picture-codes";

export const metadata: Metadata = {
  title: "How it meets the brief · Coding in Color",
  description: "Every requirement in the Coding in Color brief, where it lives in the app, and how to try it.",
};

type Try = { label: string; href?: string };
interface Requirement {
  title: string;
  what: string[];
  tryIt: Try[];
  /** Behind the private CIC admin login: described, not linked. */
  adminOnly?: boolean;
}

const REQUIREMENTS: Requirement[] = [
  {
    title: "Digital worksheets, done on the platform",
    what: [
      "Each module has a Practice worksheet with short, long and number answers, typed right in the lesson.",
      "Drafts save on the device while the student types. Submit worksheet records the answers and marks the step done.",
      "The worksheet must be submitted before the next step unlocks.",
    ],
    tryIt: [{ label: "Join as the sample student, open Module 1, go to the Practice worksheet step", href: "/join" }],
  },
  {
    title: "Learning gain from true pre-test and post-test pairs",
    what: [
      "Every module opens with a Warm-up quiz and ends with a Wrap-up quiz made of the SAME questions, so each question is a matched before/after pair.",
      "The warm-up gives no feedback, so it measures what the student knew going in. On the wrap-up only the first try counts toward the score; hints come after.",
      "Gain = wrap-up first-try score minus warm-up score, per student (My progress page), per class (teacher Overview) and per cohort and school (admin).",
    ],
    tryIt: [
      { label: "Question-by-question pairs: Curriculum catalog", href: "/curriculum" },
      { label: "Per-class gain: teacher Overview", href: "/teach" },
    ],
  },
  {
    title: "Teacher sets up a class in under 10 minutes",
    what: [
      "New class: name, school, pick which modules to assign, then paste a roster or upload a CSV (first name, last initial).",
      "Each student gets a three-picture code automatically; the class gets a 6-character join code. The roster prints for handing out codes.",
      "Students can be added later from the Roster page the same way.",
    ],
    tryIt: [
      { label: "Sign in as the trial teacher, then New class", href: "/teach/new" },
      { label: "Add students to the sample class: Roster → Import students", href: "/teach/roster" },
    ],
  },
  {
    title: "Modules unlock in sequence; late joiners catch up",
    what: [
      "In a class, Module 2 stays locked (lock icon) until Module 1 is finished, and inside a module each step unlocks after the one before.",
      "A late joiner lands on a Start here card at Module 1 with a note like “Most of your class is around Module 3, and that's okay,” so they work through at their own pace.",
      "Students can skip a step for later; it still counts as not done. Self-paced learners (no class) can open any module.",
    ],
    tryIt: [{ label: `Join as ${DEMO_STUDENT.firstName} ${DEMO_STUDENT.lastInitial}. (a late joiner), then open Course`, href: "/join" }],
  },
  {
    title: "Four roles with role-based access",
    what: [
      "Student: class code + picture code, no account. Teacher: sees only their own classes. CIC staff (admin): every school and cohort. External reviewer: curriculum and answer keys, no student data.",
      "Roles are stored on the server and enforced by Supabase row-level security and route middleware, not just hidden buttons. Each role has its own sign-in screen (/login?next=/teach, /admin, /review) and its own session.",
    ],
    tryIt: [
      { label: "Student join", href: "/join" },
      { label: "Teacher sign-in", href: "/login?next=/teach" },
    ],
  },
  {
    title: "Instructor dashboard: roster, per-student progress, stuck and not-started lists",
    what: [
      "Overview: module completion, learning gain, concept mastery, and a Need help now list of students who are stuck (3+ wrong tries on a check, or idle for 3 days), and who hasn’t started yet.",
      "Roster: every student with status (on track, stuck, not started, done), progress, and picture codes.",
      "Insights: a heat map of every student × every activity, time on task per module, activities finished per day, and flags worth a second look.",
    ],
    tryIt: [
      { label: "Teacher Overview", href: "/teach" },
      { label: "Roster", href: "/teach/roster" },
      { label: "Insights (time on task)", href: "/teach/insights" },
    ],
  },
  {
    title: "Curriculum authoring for CIC staff",
    what: [
      "Admin → Curriculum lists every module. The editor builds a module top to bottom: warm-up questions, slides, checks with hints, worksheet prompts, Python code activities with tests, exit question, wrap-up.",
      "Changes save as a draft and validate before publishing. Publishing updates every student and teacher screen live, and new modules are added to classes automatically.",
    ],
    tryIt: [{ label: "Published result, read-only: Curriculum catalog", href: "/curriculum" }],
    adminOnly: true,
  },
  {
    title: "CIC admin view: cohort completion and learning gain",
    what: [
      "Program overview: totals across every school, then Schools at a glance and Every cohort, each with completion rate, average learning gain and stuck counts.",
      "Download grant-report CSVs. Open any class to see it exactly as its teacher does. Partner schools: add a school and create its teacher's login in a minute.",
    ],
    tryIt: [],
    adminOnly: true,
  },
  {
    title: "Key-authenticated read API",
    what: [
      "GET /api/v1/cohorts with an Authorization: Bearer key returns completion and learning gain per cohort, school and program, for CIC's own dashboards.",
      "Aggregates only: never student names, picture codes or answers. The key is compared in constant time and must be at least 24 characters. Documented in docs/API.md.",
    ],
    tryIt: [{ label: "Without a key it refuses: /api/v1/cohorts", href: "/api/v1/cohorts" }],
  },
  {
    title: "P1: code runner with auto-grading, concept mastery, external teacher self-serve",
    what: [
      "Code runner: Python runs in the browser (Pyodide). Each code activity has automatic tests; checking the code shows which tests pass, and the step unlocks when all of them do. Hints are revealed one at a time.",
      "Concept mastery: every quiz question is tagged with a concept; the teacher Overview ranks concepts weakest first.",
      "External teacher self-serve: Try it with your own class on the reviewer screens, and anyone can learn on their own with a free self-learner account.",
    ],
    tryIt: [
      { label: "Code activity with tests: Curriculum catalog", href: "/curriculum" },
      { label: "Self-learner sign-up", href: "/start" },
    ],
  },
  {
    title: "Accessibility",
    what: [
      "Skip-to-content link, visible focus rings, full keyboard use (answer choices are real radio buttons), and screen-reader labels on every icon and progress bar.",
      "Display settings: dark mode, larger text, an easy-read font, wider spacing and reduced motion. Site-wide language picker.",
      "Test helpers in every lesson: Mark for review on quizzes, a highlighter, and a word-by-word reader.",
    ],
    tryIt: [{ label: "Open the floating Display button on any page, or start a lesson", href: "/join" }],
  },
];

export default function JudgesPage() {
  return (
    <div className="min-h-dvh">
      <header className="border-b-2 border-cic-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" aria-label="Coding in Color home">
            <Logo className="h-10 w-auto" />
          </Link>
          <Link href="/" className="inline-flex min-h-11 items-center gap-1 font-bold text-cic-dark underline">
            <ArrowLeft aria-hidden className="size-4" /> Home
          </Link>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-display text-4xl text-cic-dark md:text-5xl">How it meets the brief</h1>
        <p className="mt-2 max-w-3xl text-lg text-cic-muted">
          Every requirement from Coding in Color&apos;s problem statement, where it lives in the app, and how to try it yourself.
        </p>

        <section aria-labelledby="logins" className="mt-8 rounded-[24px] bg-cic-dark p-6 text-white">
          <h2 id="logins" className="font-display text-2xl">
            Demo logins
          </h2>
          <dl className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-cic-darker p-4">
              <dt className="font-bold">Student (no account)</dt>
              <dd className="mt-1 text-cic-tint">
                <Link href="/join" className="font-bold text-white underline">
                  /join
                </Link>{" "}
                → class code <strong className="font-mono text-white">{DEMO_CLASS_CODE}</strong> → {DEMO_STUDENT.firstName}{" "}
                {DEMO_STUDENT.lastInitial}. → {DEMO_STUDENT.pictureCode.map(pictureName).join(", ")}
              </dd>
            </div>
            <div className="rounded-2xl bg-cic-darker p-4">
              <dt className="font-bold">Teacher</dt>
              <dd className="mt-1 text-cic-tint">
                <Link href="/login?next=/teach" className="font-bold text-white underline">
                  Sign in
                </Link>{" "}
                with <span className="font-mono text-white">{DEMO_TEACHER_EMAIL}</span> /{" "}
                <span className="font-mono text-white">{DEMO_TEACHER_PASSWORD}</span>
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-cic-tint">
            Demo changes stay in your browser and reset when you leave or sign out. CIC admin and reviewer accounts are private; their
            screens are described below.
          </p>
        </section>

        <ol className="mt-10 space-y-5">
          {REQUIREMENTS.map((r, i) => (
            <li key={r.title} className="rounded-[var(--radius-card)] border-2 border-cic-line bg-white p-5 shadow-slab-gray">
              <h2 className="flex flex-wrap items-center gap-2 text-xl font-bold">
                <CheckCircle2 aria-hidden className="size-6 text-cic-dark" />
                <span>
                  {i + 1}. {r.title}
                </span>
                {r.adminOnly && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-cic-tint px-3 py-1 text-sm text-cic-darker">
                    <Lock aria-hidden className="size-4" /> CIC admin only
                  </span>
                )}
              </h2>
              <ul className="mt-3 list-disc space-y-1 pl-6">
                {r.what.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
              {r.tryIt.length > 0 && (
                <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                  <span className="font-bold text-cic-darker">Try it:</span>
                  {r.tryIt.map((t) =>
                    t.href ? (
                      <Link key={t.label} href={t.href} className="inline-flex min-h-11 items-center font-bold text-cic-dark underline">
                        {t.label}
                      </Link>
                    ) : (
                      <span key={t.label}>{t.label}</span>
                    ),
                  )}
                </p>
              )}
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
