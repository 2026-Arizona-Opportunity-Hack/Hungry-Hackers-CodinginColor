"use client";

import Link from "next/link";
import { AlertTriangle, CircleDashed, Copy, GraduationCap, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { Button, Card, EmptyState, HeroPanel, KpiCard, LinkButton, Loading, StatusBadge } from "@/components/ui";
import {
  STUCK_FAILED_CHECKS,
  STUCK_IDLE_DAYS,
  classGain,
  conceptMastery,
  courseProgress,
  moduleComplete,
  pct,
  signedPct,
  studentStatus,
} from "@/lib/analytics";
import { CONCEPT_LABELS } from "@/lib/types";
import { useTeacherClass } from "@/lib/use-teacher";

export default function TeacherOverview() {
  const ctx = useTeacherClass();
  const [copied, setCopied] = useState(false);
  if (!ctx) return <Loading />;
  const { cls, modules, progress, loadedAt } = ctx;

  const rows = cls.roster.map((s) => ({ s, p: progress[s.id], st: studentStatus(progress[s.id], modules) }));
  const stuck = rows.filter((r) => r.st.status === "stuck");
  const notStarted = rows.filter((r) => r.st.status === "not-started");
  const avgCompletion = rows.length ? rows.reduce((sum, r) => sum + courseProgress(r.p, modules), 0) / rows.length : 0;
  const gain = classGain(progress, cls, modules);
  const mastery = conceptMastery(progress, cls, modules);
  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}/join` : "/join";

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(`Join our class at ${joinUrl} with code ${cls.code}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (cls.roster.length === 0) {
    return (
      <EmptyState title="No students yet" action={<LinkButton href="/teach/roster">Add students</LinkButton>}>
        Import a roster CSV so students can find their name when they join.
      </EmptyState>
    );
  }

  return (
    <div>
      <HeroPanel className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-bold text-cic-tint">
              {cls.school}, updated {loadedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </p>
            <h1 className="mt-1 font-display text-3xl leading-tight md:text-4xl">{cls.name}</h1>
          </div>
          <div className="rounded-2xl bg-white p-4 text-black shadow-slab">
            <p className="text-sm font-bold text-cic-muted">Students join at {joinUrl} with</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <p className="font-display text-4xl tracking-[0.2em] text-cic-darker">{cls.code}</p>
              <Button variant="secondary" onClick={copyCode} className="min-h-11 px-4">
                <Copy aria-hidden className="size-4" /> {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
        </div>
      </HeroPanel>

      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard Icon={Users} label="Students" value={String(cls.roster.length)} note={`${rows.length - notStarted.length} have started`} />
        <KpiCard Icon={GraduationCap} label="Average completion" value={pct(avgCompletion)} note={`${modules.length} modules assigned`} />
        <KpiCard
          Icon={TrendingUp}
          label="Class learning gain"
          value={signedPct(gain.gain)}
          note={gain.students ? `${pct(gain.pre)} → ${pct(gain.post)} · ${gain.students} students` : "Needs a finished module"}
        />
        <KpiCard Icon={AlertTriangle} label="Need help now" value={String(stuck.length)} note={`${notStarted.length} not started`} />
      </div>

      <div className="stagger mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <AlertTriangle aria-hidden className="size-5 text-cic-danger" /> Who needs help
          </h2>
          <p className="text-sm text-cic-muted">
            Flagged after {STUCK_FAILED_CHECKS} wrong tries on one activity, or {STUCK_IDLE_DAYS}+ days without activity.
          </p>
          {stuck.length === 0 ? (
            <p className="mt-4">Nobody is stuck right now. 🎉</p>
          ) : (
            <ul className="mt-4 divide-y divide-cic-line">
              {stuck.map(({ s, st }) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-bold">
                      {s.firstName} {s.lastInitial}.
                    </p>
                    <p className="text-sm text-cic-muted">{st.reason}</p>
                  </div>
                  <StatusBadge status="stuck" />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <CircleDashed aria-hidden className="size-5 text-cic-warn" /> Not started yet
          </h2>
          <p className="text-sm text-cic-muted">They can start any time — the course shows them exactly where to begin.</p>
          {notStarted.length === 0 ? (
            <p className="mt-4">Everyone has started.</p>
          ) : (
            <ul className="mt-4 flex flex-wrap gap-2">
              {notStarted.map(({ s }) => (
                <li key={s.id} className="rounded-full bg-cic-warn-bg px-3 py-1 font-bold text-cic-warn">
                  {s.firstName} {s.lastInitial}.
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Module completion</h2>
          <ul className="mt-4 space-y-3">
            {modules.map((m) => {
              const n = rows.filter((r) => moduleComplete(r.p, m)).length;
              return (
                <li key={m.id}>
                  <div className="flex justify-between text-sm">
                    <span className="font-bold">
                      {m.number}. {m.title}
                    </span>
                    <span>
                      {n} of {rows.length} students
                    </span>
                  </div>
                  <div className="mt-1 h-4 overflow-hidden rounded-full bg-cic-tint" aria-hidden>
                    <div className="h-full origin-left animate-grow bg-cic-green" style={{ width: `${(n / rows.length) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Concept mastery</h2>
          <p className="text-sm text-cic-muted">Share of quiz answers correct, weakest concepts first.</p>
          <table className="mt-3 w-full text-left text-sm">
            <caption className="sr-only">Concept mastery for this class</caption>
            <thead>
              <tr className="border-b border-cic-line">
                <th scope="col" className="py-2">Concept</th>
                <th scope="col" className="py-2">Mastery</th>
                <th scope="col" className="py-2 text-right">Answers</th>
              </tr>
            </thead>
            <tbody>
              {mastery.map((c) => (
                <tr key={c.concept} className="border-b border-cic-line last:border-0">
                  <th scope="row" className="py-2 font-bold">
                    {CONCEPT_LABELS[c.concept]}
                  </th>
                  <td className="py-2">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-24 overflow-hidden rounded-full bg-cic-tint ring-1 ring-cic-line ring-inset" aria-hidden>
                        <span className="block h-full origin-left animate-grow bg-cic-dark" style={{ width: `${c.mastery * 100}%` }} />
                      </span>
                      {pct(c.mastery)}
                      {c.mastery < 0.6 && <span className="font-bold text-cic-danger">· Reteach</span>}
                    </span>
                  </td>
                  <td className="py-2 text-right">{c.answers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <p className="mt-6 text-sm">
        See every student&apos;s status, picture code and learning gain on the{" "}
        <Link href="/teach/roster" className="font-bold text-cic-dark underline underline-offset-2">
          roster
        </Link>
        .
      </p>
    </div>
  );
}
