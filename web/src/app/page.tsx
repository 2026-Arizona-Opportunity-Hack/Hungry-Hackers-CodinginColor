import Link from "next/link";
import { BookOpen, GraduationCap, KeyRound, LineChart, ShieldCheck, Sparkles } from "lucide-react";
import { Logo, LinkButton } from "@/components/ui";

export default function Welcome() {
  return (
    <div className="min-h-dvh">
      <header className="border-b-2 border-cic-dark bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo className="h-9 w-auto" />
          <nav aria-label="Quick links" className="flex gap-1 text-sm font-bold">
            <Link href="/curriculum" className="rounded-lg px-3 py-2 text-cic-dark hover:bg-cic-tint">
              Browse curriculum
            </Link>
            <Link href="/teach" className="rounded-lg px-3 py-2 text-cic-dark hover:bg-cic-tint">
              For teachers
            </Link>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:py-20">
          <div>
            <p className="font-bold text-cic-dark">Coding in Color · Learn</p>
            <h1 className="mt-2 text-4xl leading-tight font-bold text-black md:text-5xl">
              Computer science and AI lessons that teach themselves.
            </h1>
            <p className="mt-4 max-w-prose text-lg text-cic-muted">
              Students follow each module at their own pace — slides, a quick check, hands-on practice and an exit
              question. Teachers share one class code and watch progress live.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/join" className="text-lg">
                <KeyRound aria-hidden className="size-5" /> Join with a class code
              </LinkButton>
              <LinkButton href="/teach" variant="secondary" className="text-lg">
                <GraduationCap aria-hidden className="size-5" /> I&apos;m a teacher
              </LinkButton>
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm text-cic-muted">
              <ShieldCheck aria-hidden className="size-4 text-cic-dark" />
              No student accounts, no email — just a class code.
            </p>
          </div>
          <div className="flex justify-center">
            <Logo variant="stacked" className="h-auto w-64 md:w-80" />
          </div>
        </section>

        <section aria-labelledby="how" className="bg-cic-tint py-14">
          <div className="mx-auto max-w-6xl px-4">
            <h2 id="how" className="text-2xl font-bold text-cic-dark">
              How it works
            </h2>
            <ol className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                {
                  Icon: GraduationCap,
                  title: "1. Teacher shares a code",
                  body: "Create a class, upload a roster CSV, assign modules. Under 10 minutes, no CS background needed.",
                },
                {
                  Icon: BookOpen,
                  title: "2. Students learn at their pace",
                  body: "Every module: warm-up, slides, quick check, practice or code, exit question, wrap-up. Late joiners see exactly where to start.",
                },
                {
                  Icon: LineChart,
                  title: "3. Everyone sees growth",
                  body: "Learning gain (wrap-up minus warm-up) per student and per class, plus who's stuck — no spreadsheet.",
                },
              ].map(({ Icon, title, body }) => (
                <li key={title} className="rounded-[var(--radius-card)] bg-white p-5">
                  <Icon aria-hidden className="size-7 text-cic-dark" />
                  <h3 className="mt-3 text-lg font-bold">{title}</h3>
                  <p className="mt-1 text-cic-muted">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-card)] border border-cic-line p-6">
            <div className="flex items-center gap-3">
              <Sparkles aria-hidden className="size-6 text-cic-dark" />
              <p className="font-bold">District teacher or reviewer? Browse the full curriculum — no sign-in.</p>
            </div>
            <LinkButton href="/curriculum" variant="secondary">
              Browse curriculum
            </LinkButton>
          </div>
        </section>
      </main>

      <footer className="border-t border-cic-line py-6 text-center text-sm text-cic-muted">
        Coding in Color is a 501(c)(3) nonprofit developing Arizona&apos;s future digital workforce.
      </footer>
    </div>
  );
}
