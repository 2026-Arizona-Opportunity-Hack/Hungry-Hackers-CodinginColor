"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, LineChart, TrendingUp, Users } from "lucide-react";
import { useMemo } from "react";
import { assignedModules, courseProgress, pct, signedPct, studentGain, studentStatus } from "@/lib/analytics";
import { EmptyState, KpiCard, LinkButton, Loading, PageTitle, ProgressBar, StatusBadge } from "@/components/ui";
import { getCourse } from "@/lib/repo";
import { useAdmin } from "@/lib/use-admin";

/** One cohort, read-only, for the CIC admin: every student's status, progress and learning gain. */
export default function AdminClassPage() {
  const { classId } = useParams<{ classId: string }>();
  const { data, summaries, error } = useAdmin();

  const found = useMemo(() => {
    if (!data) return null;
    const cls = data.data.classes.find((c) => c.id === classId);
    if (!cls) return null;
    const course = getCourse(cls.courseId);
    const modules = course ? assignedModules(course, cls) : [];
    const progress = data.data.progress[cls.id] ?? {};
    const rows = cls.roster
      .map((s) => ({
        s,
        st: studentStatus(progress[s.id], modules),
        done: courseProgress(progress[s.id], modules),
        g: studentGain(progress[s.id], modules),
      }))
      .sort((a, b) => a.s.firstName.localeCompare(b.s.firstName));
    const school = data.schools.find((x) => x.id === cls.schoolId)?.name ?? cls.school;
    return { cls, rows, school, summary: summaries.find((x) => x.cls.id === cls.id) };
  }, [data, summaries, classId]);

  if (error) {
    return (
      <p role="alert" className="rounded-xl bg-cic-danger-bg p-4 text-cic-danger">
        <strong>We couldn&apos;t load this class.</strong> {error}
      </p>
    );
  }
  if (!data) return <Loading label="Loading the class…" />;
  if (!found) {
    return (
      <EmptyState title="Class not found" action={<LinkButton href="/admin">Back to the overview</LinkButton>}>
        It may have been removed.
      </EmptyState>
    );
  }
  const { cls, rows, school, summary } = found;

  return (
    <div>
      <Link href="/admin" className="mb-3 inline-flex min-h-11 items-center gap-1 font-bold text-cic-dark underline">
        <ArrowLeft aria-hidden className="size-4" /> All cohorts
      </Link>
      <PageTitle title={cls.name} subtitle={`${school} · ${cls.teacherName} · class code ${cls.code}`} />

      {summary && (
        <ul className="mb-6 grid gap-4 sm:grid-cols-3">
          <li>
            <KpiCard Icon={Users} label="Students" value={String(summary.students)} note={`${summary.started} have started · ${summary.stuck} need help`} />
          </li>
          <li>
            <KpiCard Icon={LineChart} label="Average completion" value={pct(summary.completion)} note="of assigned activities" />
          </li>
          <li>
            <KpiCard Icon={TrendingUp} label="Learning gain" value={signedPct(summary.gain)} note={`${pct(summary.pre)} warm-up → ${pct(summary.post)} wrap-up`} />
          </li>
        </ul>
      )}

      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-cic-line">
        <table className="w-full min-w-[760px] text-left">
          <caption className="sr-only">Students in {cls.name} with status, progress, warm-up and wrap-up scores and learning gain</caption>
          <thead className="bg-cic-dark text-white">
            <tr>
              <th scope="col" className="p-3">Student</th>
              <th scope="col" className="p-3">Status</th>
              <th scope="col" className="p-3">Progress</th>
              <th scope="col" className="p-3">Warm-up → wrap-up</th>
              <th scope="col" className="p-3">Learning gain</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ s, st, done, g }, i) => (
              <tr key={s.id} className={i % 2 ? "bg-cic-tint" : "bg-white"}>
                <th scope="row" className="p-3 font-bold">
                  {s.firstName} {s.lastInitial && `${s.lastInitial}.`}
                </th>
                <td className="p-3">
                  <StatusBadge status={st.status} />
                  <p className="mt-1 text-sm text-cic-muted">{st.reason}</p>
                </td>
                <td className="p-3">
                  <span className="text-sm">{pct(done)}</span>
                  <ProgressBar className="mt-1 max-w-32" value={done} label={`${s.firstName}'s progress`} />
                </td>
                <td className="p-3">
                  {pct(g.pre)} → {pct(g.post)}
                </td>
                <td className="p-3 font-bold">{signedPct(g.gain)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-cic-muted">
                  No students in this class yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
