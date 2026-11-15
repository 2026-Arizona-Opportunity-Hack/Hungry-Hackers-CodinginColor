"use client";

import { Building2, Download, GraduationCap, LineChart, Plus, TrendingUp, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { cohortsCsv, rollup, studentsCsv, type ClassSummary } from "@/lib/admin-analytics";
import { pct, signedPct } from "@/lib/analytics";
import { Button, Card, EmptyState, KpiCard, LinkButton, Loading, PageTitle, ProgressBar } from "@/components/ui";
import { selectClass } from "@/lib/use-teacher";
import { useAdmin } from "@/lib/use-admin";

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminOverview() {
  const router = useRouter();
  const { data, summaries, error, loadedAt } = useAdmin();

  const { rows, bySchool, all } = useMemo(() => {
    if (!data) return { rows: [], bySchool: [], all: rollup([]) };
    const schoolById = new Map(data.schools.map((s) => [s.id, s]));
    const teacherById = new Map(data.teachers.map((t) => [t.id, t]));
    const rows = summaries
      .map((summary) => {
        const sch = summary.cls.schoolId ? schoolById.get(summary.cls.schoolId) : undefined;
        return {
          key: summary.cls.schoolId ?? `text:${summary.cls.school}`,
          school: sch?.name ?? (summary.cls.school || "No school"),
          city: sch?.city ?? "",
          teacher: (summary.cls.teacherId && teacherById.get(summary.cls.teacherId)?.name) || summary.cls.teacherName,
          summary,
        };
      })
      .sort((a, b) => a.school.localeCompare(b.school) || a.summary.cls.name.localeCompare(b.summary.cls.name));
    const groups = new Map<string, { name: string; city: string; list: ClassSummary[] }>();
    for (const r of rows) {
      const g = groups.get(r.key) ?? { name: r.school, city: r.city, list: [] };
      g.list.push(r.summary);
      groups.set(r.key, g);
    }
    const bySchool = [...groups.values()].map((g) => ({ ...g, total: rollup(g.list) }));
    return { rows, bySchool, all: rollup(summaries) };
  }, [data, summaries]);

  if (error) {
    return (
      <p role="alert" className="rounded-xl bg-cic-danger-bg p-4 text-cic-danger">
        <strong>We couldn&apos;t load the program data.</strong> {error}
      </p>
    );
  }
  if (!data) return <Loading label="Loading every school and class…" />;
  if (rows.length === 0) {
    return (
      <EmptyState title="No classes yet" action={<LinkButton href="/admin/schools">Add a partner school</LinkButton>}>
        Once a school&apos;s teacher creates a class, its progress shows up here.
      </EmptyState>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageTitle
        title="Program overview"
        subtitle={`${all.classes} cohorts across ${bySchool.length} schools · updated ${loadedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => download(`cic-cohort-report-${today}.csv`, cohortsCsv(rows))}>
              <Download aria-hidden className="size-4" /> Cohort report (CSV)
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                download(
                  `cic-student-report-${today}.csv`,
                  studentsCsv(rows.map((r) => ({ school: r.school, cls: r.summary.cls, progress: data.data.progress[r.summary.cls.id] ?? {} }))),
                )
              }
            >
              <Download aria-hidden className="size-4" /> Per-student report (CSV)
            </Button>
            <LinkButton href="/admin/schools">
              <Plus aria-hidden className="size-4" /> Add a school
            </LinkButton>
          </>
        }
      />

      <ul className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <li>
          <KpiCard Icon={Building2} label="Partner schools" value={String(bySchool.length)} note={`${all.classes} cohorts`} />
        </li>
        <li>
          <KpiCard Icon={Users} label="Students" value={String(all.students)} note={`${all.started} have started`} />
        </li>
        <li>
          <KpiCard Icon={LineChart} label="Average completion" value={pct(all.completion)} note="of assigned activities" />
        </li>
        <li>
          <KpiCard Icon={TrendingUp} label="Learning gain" value={signedPct(all.gain)} note={`${pct(all.pre)} warm-up → ${pct(all.post)} wrap-up`} />
        </li>
      </ul>

      <h2 className="mb-3 font-display text-2xl text-cic-dark">Schools at a glance</h2>
      <div className="mb-8 overflow-x-auto rounded-[var(--radius-card)] border border-cic-line">
        <table className="w-full min-w-[720px] text-left">
          <caption className="sr-only">Each partner school with its cohorts, students, completion, learning gain and students needing help</caption>
          <thead className="bg-cic-dark text-white">
            <tr>
              <th scope="col" className="p-3">School</th>
              <th scope="col" className="p-3">Cohorts</th>
              <th scope="col" className="p-3">Students</th>
              <th scope="col" className="p-3">Completion</th>
              <th scope="col" className="p-3">Learning gain</th>
              <th scope="col" className="p-3">Need help</th>
            </tr>
          </thead>
          <tbody>
            {bySchool.map((g, i) => (
              <tr key={g.name} className={i % 2 ? "bg-cic-tint" : "bg-white"}>
                <th scope="row" className="p-3 font-bold">
                  {g.name}
                  {g.city && <span className="block text-sm font-normal text-cic-muted">{g.city}</span>}
                </th>
                <td className="p-3">{g.total.classes}</td>
                <td className="p-3">{g.total.students}</td>
                <td className="p-3">
                  <span className="text-sm">{pct(g.total.completion)}</span>
                  <ProgressBar className="mt-1 max-w-32" value={g.total.completion ?? 0} label={`${g.name} completion`} />
                </td>
                <td className="p-3 font-bold">{signedPct(g.total.gain)}</td>
                <td className="p-3">{g.total.stuck}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 font-display text-2xl text-cic-dark">Every cohort</h2>
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-cic-line">
        <table className="w-full min-w-[900px] text-left">
          <caption className="sr-only">Every class across all schools, with teacher, students, completion, warm-up and wrap-up scores and learning gain</caption>
          <thead className="bg-cic-dark text-white">
            <tr>
              <th scope="col" className="p-3">Cohort</th>
              <th scope="col" className="p-3">Teacher</th>
              <th scope="col" className="p-3">Students</th>
              <th scope="col" className="p-3">Completion</th>
              <th scope="col" className="p-3">Warm-up → wrap-up</th>
              <th scope="col" className="p-3">Learning gain</th>
              <th scope="col" className="p-3">Need help</th>
              <th scope="col" className="p-3"><span className="sr-only">Open</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ school, teacher, summary: s }, i) => (
              <tr key={s.cls.id} className={i % 2 ? "bg-cic-tint" : "bg-white"}>
                <th scope="row" className="p-3 font-bold">
                  {s.cls.name}
                  <span className="block text-sm font-normal text-cic-muted">
                    {school} · code {s.cls.code}
                  </span>
                </th>
                <td className="p-3">{teacher}</td>
                <td className="p-3">
                  {s.students}
                  <span className="block text-sm text-cic-muted">{s.started} started</span>
                </td>
                <td className="p-3">
                  <span className="text-sm">{pct(s.completion)}</span>
                  <ProgressBar className="mt-1 max-w-32" value={s.completion} label={`${s.cls.name} completion`} />
                </td>
                <td className="p-3">
                  {pct(s.pre)} → {pct(s.post)}
                </td>
                <td className="p-3 font-bold">{signedPct(s.gain)}</td>
                <td className="p-3">{s.stuck}</td>
                <td className="p-3">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      selectClass(s.cls.id);
                      router.push("/teach");
                    }}
                  >
                    <GraduationCap aria-hidden className="size-4" /> Open
                    <span className="sr-only"> {s.cls.name}</span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-cic-muted">
        Learning gain is each student&apos;s wrap-up quiz score minus their warm-up score, averaged over students who took both. The cohort CSV has one row per cohort, and the per-student CSV has one row per student, both ready for a grant report.
      </p>
      <Card className="mt-6 print:hidden">
        <p className="text-sm text-cic-muted">
          Open any cohort to see its roster, insights and picture codes exactly as its teacher does.
        </p>
      </Card>
    </div>
  );
}
