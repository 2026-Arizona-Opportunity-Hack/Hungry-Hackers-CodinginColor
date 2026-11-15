import Link from "next/link";
import { BookOpen, Check, Flame, GraduationCap, KeyRound, LineChart, ShieldCheck, Star } from "lucide-react";
import { Brackets, LinkButton, Logo } from "@/components/ui";

const STEPS = [
  {
    Icon: GraduationCap,
    title: "Teacher shares a code",
    body: "Create a class, upload a roster CSV and pick modules. It takes under 10 minutes, with no CS background needed.",
  },
  {
    Icon: BookOpen,
    title: "Students learn at their pace",
    body: "Each module runs warm-up, slides, quick check, practice or code, exit question, then wrap-up. Late joiners see exactly where to start.",
  },
  {
    Icon: LineChart,
    title: "Everyone sees growth",
    body: "Learning gain (wrap-up minus warm-up) for each student and the whole class, plus who's stuck, with no spreadsheet.",
  },
];

/** A static preview of a real check question from Module 1, so visitors see the product first. */
function LessonPreview() {
  const choices = ["Any computer connected to the internet", "Computer systems that do tasks that usually need human intelligence", "A robot that looks like a person"];
  return (
    <div role="img" aria-label="Preview of a lesson: a quiz question about what AI is, with the correct answer picked" className="relative mx-auto w-full max-w-md">
      <div className="absolute -top-5 -left-3 z-10 flex -rotate-3 items-center gap-2 rounded-full bg-white px-4 py-2 font-bold text-cic-darker shadow-slab">
        <Flame aria-hidden className="size-5 text-cic-warn" /> 4 day streak
      </div>
      <div className="rounded-[28px] bg-white p-5 text-black shadow-[0_8px_0_var(--color-cic-darker)]">
        <div className="mt-3 flex items-center justify-between text-sm font-bold text-cic-muted">
          <span>Module 1: What is AI?</span>
          <span className="flex items-center gap-1 text-cic-dark">
            <Star aria-hidden className="size-4" /> 30 XP
          </span>
        </div>
        <div className="mt-3 flex gap-1.5" aria-hidden>
          {[1, 1, 1, 0, 0, 0].map((d, i) => (
            <span key={i} className={d ? "h-2 flex-1 rounded-full bg-cic-green" : i === 3 ? "h-2 flex-1 rounded-full bg-cic-dark" : "h-2 flex-1 rounded-full bg-cic-tint"} />
          ))}
        </div>
        <p className="mt-4 text-lg font-bold">Which best describes artificial intelligence?</p>
        <ul className="mt-3 space-y-2">
          {choices.map((c, i) => (
            <li
              key={c}
              className={
                i === 1
                  ? "flex items-center gap-3 rounded-2xl border-2 border-cic-dark bg-cic-tint p-2.5 text-sm font-bold shadow-slab"
                  : "flex items-center gap-3 rounded-2xl border-2 border-cic-line p-2.5 text-sm font-bold shadow-slab-gray"
              }
            >
              <span className={i === 1 ? "grid size-8 shrink-0 place-items-center rounded-lg bg-cic-dark font-display text-white" : "grid size-8 shrink-0 place-items-center rounded-lg bg-cic-tint font-display text-cic-dark"}>
                {"ABC"[i]}
              </span>
              <span className="flex-1">{c}</span>
              {i === 1 && <Check aria-hidden className="size-5 text-cic-dark" strokeWidth={3} />}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Welcome() {
  return (
    <div className="min-h-dvh">
      <header className="border-b-2 border-cic-line bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo className="h-9 w-auto" />
          <nav aria-label="Quick links" className="flex gap-1 text-sm font-bold">
            <Link href="/judges" className="rounded-xl bg-cic-tint px-3 py-2 text-cic-darker hover:bg-cic-line">
              For judges
            </Link>
            <Link href="/curriculum" className="hidden rounded-xl px-3 py-2 text-cic-dark hover:bg-cic-tint sm:block">
              Browse curriculum
            </Link>
            <Link href="/teach" className="rounded-xl px-3 py-2 text-cic-dark hover:bg-cic-tint">
              For teachers
            </Link>
            <Link href="/start" className="rounded-xl px-3 py-2 text-cic-dark hover:bg-cic-tint">
              Learn on your own
            </Link>
            <Link href="/admin" className="rounded-xl px-3 py-2 text-cic-dark hover:bg-cic-tint">
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="relative overflow-hidden bg-cic-dark text-white">
          <Brackets className="pointer-events-none absolute -bottom-24 -left-24 w-[34rem] text-cic-darker" />
          <Brackets className="pointer-events-none absolute -top-20 right-[-8rem] w-[30rem] text-cic-green opacity-25" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 md:grid-cols-[1.1fr_1fr] md:py-24">
            <div>
              <h1 className="font-display text-4xl leading-[1.05] md:text-6xl">CS and AI lessons that teach themselves.</h1>
              <p className="mt-5 max-w-prose text-lg text-cic-tint md:text-xl">
                Students work through each module at their own pace. Teachers share one class code and see who&apos;s growing and who&apos;s stuck,
                live.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <LinkButton href="/join" variant="light" className="min-h-14 text-lg">
                  <KeyRound aria-hidden className="size-5" /> Join with a class code
                </LinkButton>
                <LinkButton href="/teach" className="min-h-14 bg-cic-darker text-lg ring-2 ring-white/40 ring-inset hover:bg-cic-darker-hover">
                  <GraduationCap aria-hidden className="size-5" /> I&apos;m a teacher
                </LinkButton>
                <LinkButton href="/start" className="min-h-14 bg-cic-darker text-lg ring-2 ring-white/40 ring-inset hover:bg-cic-darker-hover">
                  <BookOpen aria-hidden className="size-5" /> Learn on my own
                </LinkButton>
                <LinkButton href="/admin" className="min-h-14 bg-cic-darker text-lg ring-2 ring-white/40 ring-inset hover:bg-cic-darker-hover">
                  <ShieldCheck aria-hidden className="size-5" /> CIC Admin
                </LinkButton>
              </div>
              <p className="mt-5 flex items-center gap-2 text-cic-tint">
                <ShieldCheck aria-hidden className="size-5" />
                Joining a class needs no account or email, just a class code.
              </p>
            </div>
            <LessonPreview />
          </div>
        </section>

        <section aria-labelledby="how" className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 id="how" className="font-display text-3xl text-cic-dark md:text-4xl">
              How it works
            </h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {STEPS.map(({ Icon, title, body }, i) => (
                <li key={title} className="relative rounded-[24px] border-2 border-cic-line bg-white p-6 shadow-slab-gray">
                  <span className="absolute -top-4 left-6 grid size-9 place-items-center rounded-full bg-cic-dark font-display text-white shadow-slab">
                    {i + 1}
                  </span>
                  <span className="mt-2 grid size-14 place-items-center rounded-2xl bg-cic-tint text-cic-dark">
                    <Icon aria-hidden className="size-7" />
                  </span>
                  <h3 className="mt-4 text-xl font-bold">{title}</h3>
                  <p className="mt-2 text-cic-muted">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] bg-cic-tint p-6 md:p-8">
            <div>
              <h2 className="font-display text-2xl text-cic-darker">Are you an external reviewer?</h2>
              <p className="mt-1 text-cic-muted">Browse every module and quiz question without signing in, or sign in to review the full curriculum with answer keys.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <LinkButton href="/curriculum" variant="secondary">
                Browse curriculum
              </LinkButton>
              <LinkButton href="/review">Reviewer sign in</LinkButton>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-cic-line py-6 text-center text-sm text-cic-muted">
        Coding in Color is a 501(c)(3) nonprofit developing Arizona&apos;s future digital workforce.
      </footer>
    </div>
  );
}
