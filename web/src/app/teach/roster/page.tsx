"use client";

import { Printer, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { RosterImport } from "@/components/roster-import";
import { Button, Card, Loading, PageTitle, ProgressBar, StatusBadge } from "@/components/ui";
import { courseProgress, signedPct, studentGain, studentStatus, type StudentStatus } from "@/lib/analytics";
import type { RosterParseResult } from "@/lib/csv";
import { pictureName } from "@/lib/picture-codes";
import { saveClass } from "@/lib/repo";
import { useTeacherClass } from "@/lib/use-teacher";

const FILTERS: { value: StudentStatus | "all"; label: string }[] = [
  { value: "all", label: "Everyone" },
  { value: "stuck", label: "Needs help" },
  { value: "not-started", label: "Not started" },
  { value: "on-track", label: "On track" },
  { value: "complete", label: "Complete" },
];

export default function RosterPage() {
  const ctx = useTeacherClass();
  const [filter, setFilter] = useState<StudentStatus | "all">("all");
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState<RosterParseResult | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const rows = useMemo(() => {
    if (!ctx) return [];
    return ctx.cls.roster
      .map((s) => ({
        s,
        st: studentStatus(ctx.progress[s.id], ctx.modules),
        done: courseProgress(ctx.progress[s.id], ctx.modules),
        gain: studentGain(ctx.progress[s.id], ctx.modules).gain,
      }))
      .sort((a, b) => a.s.firstName.localeCompare(b.s.firstName));
  }, [ctx]);

  if (!ctx) return <Loading />;
  const { cls } = ctx;
  const isDemo = cls.id === "maryvale-p3";
  const shown = filter === "all" ? rows : rows.filter((r) => r.st.status === filter);

  function addStudents() {
    if (!pending) return;
    const existing = new Set(cls.roster.map((s) => `${s.firstName} ${s.lastInitial}`.toLowerCase()));
    const fresh = pending.students.filter((s) => !existing.has(`${s.firstName} ${s.lastInitial}`.toLowerCase()));
    saveClass({ ...cls, roster: [...cls.roster, ...fresh.map((s) => ({ ...s, id: `${cls.id}-${s.id}` }))] });
    setSaved(`Added ${fresh.length} student${fresh.length === 1 ? "" : "s"}${fresh.length < pending.students.length ? " (duplicates skipped)" : ""}.`);
    setPending(null);
    setAdding(false);
  }

  return (
    <div>
      <PageTitle
        title="Roster"
        subtitle={`${cls.name} · ${cls.roster.length} students · class code ${cls.code}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer aria-hidden className="size-4" /> Print picture codes
            </Button>
            {!isDemo && (
              <Button onClick={() => setAdding((a) => !a)} aria-expanded={adding}>
                <UserPlus aria-hidden className="size-4" /> Add students
              </Button>
            )}
          </>
        }
      />

      {saved && (
        <p role="status" className="mb-4 rounded-xl bg-cic-tint px-4 py-2 font-bold text-cic-darker">
          {saved}
        </p>
      )}

      {adding && (
        <Card className="mb-6">
          <h2 className="mb-3 text-lg font-bold">Import students</h2>
          <RosterImport seedOffset={cls.roster.length} onParsed={setPending} />
          <Button className="mt-4" disabled={!pending?.students.length} onClick={addStudents}>
            Add {pending?.students.length ?? 0} students
          </Button>
        </Card>
      )}

      <fieldset className="mb-4 flex flex-wrap gap-2 print:hidden">
        <legend className="sr-only">Show students by status</legend>
        {FILTERS.map((f) => {
          const n = f.value === "all" ? rows.length : rows.filter((r) => r.st.status === f.value).length;
          return (
            <label
              key={f.value}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 border-cic-line px-4 font-bold has-[:checked]:border-cic-dark has-[:checked]:bg-cic-tint has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-cic-dark"
            >
              <input type="radio" name="status" value={f.value} checked={filter === f.value} onChange={() => setFilter(f.value)} className="sr-only" />
              {f.label} <span className="text-cic-muted">{n}</span>
            </label>
          );
        })}
      </fieldset>

      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-cic-line">
        <table className="w-full min-w-[720px] text-left">
          <caption className="sr-only">Students in {cls.name}, with sign-in picture code, status, progress and learning gain</caption>
          <thead className="bg-cic-dark text-white">
            <tr>
              <th scope="col" className="p-3">Student</th>
              <th scope="col" className="p-3">Picture code</th>
              <th scope="col" className="p-3">Status</th>
              <th scope="col" className="p-3">Progress</th>
              <th scope="col" className="p-3">Learning gain</th>
            </tr>
          </thead>
          <tbody>
            {shown.map(({ s, st, done, gain }, i) => (
              <tr key={s.id} className={i % 2 ? "bg-cic-tint" : "bg-white"}>
                <th scope="row" className="p-3 font-bold">
                  {s.firstName} {s.lastInitial}.
                </th>
                <td className="p-3">
                  <span className="text-2xl" aria-hidden>
                    {s.pictureCode.join(" ")}
                  </span>
                  <span className="sr-only">{s.pictureCode.map(pictureName).join(", ")}</span>
                </td>
                <td className="p-3">
                  <StatusBadge status={st.status} />
                  <p className="mt-1 text-sm text-cic-muted">{st.reason}</p>
                </td>
                <td className="p-3">
                  <span className="text-sm">{Math.round(done * 100)}%</span>
                  <ProgressBar className="mt-1 max-w-32" value={done} label={`${s.firstName}'s progress`} />
                </td>
                <td className="p-3 font-bold">{signedPct(gain)}</td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-cic-muted">
                  No students with this status.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-cic-muted">
        Picture codes let students sign in without passwords or email. Hand each student their own code; reset it from here once sign-in is live.
      </p>
    </div>
  );
}
