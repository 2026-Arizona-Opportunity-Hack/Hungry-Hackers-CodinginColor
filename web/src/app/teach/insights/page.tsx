"use client";

import { AlertTriangle, Clock, Flag, Gauge, Timer, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Card, EmptyState, KpiCard, LinkButton, Loading, PageTitle, cx } from "@/components/ui";
import { LoadProblem, NoClasses } from "@/components/teacher-states";
import { pct, signedPct } from "@/lib/analytics";
import {
  BURST_COUNT,
  BURST_WINDOW_SECS,
  FLAG_LABELS,
  HEAT,
  RUSHED_SHARE,
  SCORE_STEP_LABELS,
  TIME_STEP_LABELS,
  columns,
  dailyActivity,
  duration,
  flaggedItems,
  heatStep,
  heatText,
  median,
  minutes,
  moduleTimes,
  studentRows,
  timeStep,
  type Cell,
  type Column,
  type StudentRow,
} from "@/lib/insights";
import { STAGE_LABELS, type RosterStudent } from "@/lib/types";
import { useTeacherClass } from "@/lib/use-teacher";

type Mode = "score" | "time";

const name = (s: RosterStudent) => `${s.firstName}${s.lastInitial ? ` ${s.lastInitial}.` : ""}`;
const fmtDate = (iso: string) => new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** One hover/focus tooltip shared by every chart on the page. Content is rendered as text, never HTML. */
interface Tip {
  x: number;
  y: number;
  lines: string[];
}

function Tooltip({ tip }: { tip: Tip | null }) {
  if (!tip) return null;
  return (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-50 max-w-xs rounded-xl bg-black px-3 py-2 text-sm text-white shadow-lg"
      style={{ left: Math.min(tip.x + 14, window.innerWidth - 300), top: tip.y + 14 }}
    >
      <p className="font-bold">{tip.lines[0]}</p>
      {tip.lines.slice(1).map((l, i) => (
        <p key={i} className="text-white/85">
          {l}
        </p>
      ))}
    </div>
  );
}

function cellLines(student: RosterStudent, col: Column, cell: Cell): string[] {
  const head = `${name(student)} · M${col.module.number} ${STAGE_LABELS[col.activity.kind]}`;
  if (!cell.done || !cell.result) return [head, "Not done yet"];
  const r = cell.result;
  return [
    r.score !== undefined ? `${Math.round(r.score * 100)}% score` : "Done (no score)",
    head,
    `${minutes(r.secondsOnTask)} on task · about ${col.activity.minutes} min expected`,
    `${r.attempts} attempt${r.attempts === 1 ? "" : "s"} · ${fmtDate(r.completedAt)}`,
    ...cell.flags.map((f) => `⚠ ${FLAG_LABELS[f.kind]}: ${f.detail}`),
  ];
}

// ---------- heat map ----------

function HeatMap({
  rows,
  cols,
  mode,
  onTip,
  onPick,
}: {
  rows: StudentRow[];
  cols: Column[];
  mode: Mode;
  onTip: (t: Tip | null) => void;
  onPick: (id: string) => void;
}) {
  const groups = cols.reduce<{ module: Column["module"]; span: number }[]>((acc, c) => {
    const last = acc[acc.length - 1];
    if (last && last.module === c.module) last.span++;
    else acc.push({ module: c.module, span: 1 });
    return acc;
  }, []);

  return (
    <div className="max-h-[36rem] overflow-auto rounded-xl border-2 border-cic-line" onPointerLeave={() => onTip(null)}>
      <table className="border-separate border-spacing-0.5 text-xs">
        <caption className="sr-only">
          {mode === "score" ? "Score" : "Time on task"} for each student and activity. Empty cells are not done yet.
        </caption>
        <thead className="sticky top-0 z-20 bg-white">
          <tr>
            <th scope="col" rowSpan={2} className="sticky left-0 z-30 bg-white px-2 text-left align-bottom text-sm">
              Student
            </th>
            {groups.map((g) => (
              <th key={g.module.id} scope="colgroup" colSpan={g.span} className="border-b-2 border-cic-line px-1 pt-2 text-center font-bold">
                Module {g.module.number}
              </th>
            ))}
          </tr>
          <tr>
            {cols.map((c) => (
              <th key={c.activity.id} scope="col" title={c.activity.title} className="h-24 w-9 min-w-9 align-bottom font-normal text-cic-muted">
                <span className="inline-block origin-bottom-left translate-x-4 -rotate-60 whitespace-nowrap">{STAGE_LABELS[c.activity.kind]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.student.id}>
              <th scope="row" className="sticky left-0 z-10 bg-white pr-2 text-left">
                <button
                  type="button"
                  onClick={() => onPick(row.student.id)}
                  className="min-h-9 rounded-lg px-2 text-sm font-bold whitespace-nowrap text-cic-dark underline-offset-2 hover:underline"
                >
                  {name(row.student)}
                  {row.flagCount > 0 && <AlertTriangle aria-label="has results worth a look" className="ml-1 inline size-3.5 text-cic-warn" />}
                </button>
              </th>
              {row.cells.map((cell, i) => {
                const col = cols[i];
                const r = cell.result;
                const score = r?.score;
                const step = !cell.done ? null : mode === "time" ? timeStep(cell.timeRatio ?? 1) : score !== undefined ? heatStep(score) : null;
                const label = !cell.done ? "" : mode === "time" ? minutes(r?.secondsOnTask ?? 0) : score !== undefined ? String(Math.round(score * 100)) : "✓";
                const flagged = cell.flags.length > 0;
                return (
                  <td
                    key={col.activity.id}
                    onPointerMove={(e) => onTip({ x: e.clientX, y: e.clientY, lines: cellLines(row.student, col, cell) })}
                    className={cx(
                      "relative h-9 w-9 min-w-9 rounded-md text-center font-bold tabular-nums transition-[outline] hover:outline-2 hover:outline-black",
                      !cell.done && "border border-dashed border-cic-line bg-white",
                      cell.done && step === null && "bg-cic-tint text-cic-darker",
                    )}
                    style={step !== null ? { backgroundColor: HEAT[step], color: heatText(step) } : undefined}
                  >
                    {label}
                    <span className="sr-only">
                      {!cell.done ? "not done" : mode === "score" && score === undefined ? "done" : ""}
                      {flagged ? `, worth a look: ${cell.flags.map((f) => FLAG_LABELS[f.kind]).join(", ")}` : ""}
                    </span>
                    {flagged && (
                      <span aria-hidden className="absolute -top-1 -right-1 grid size-3.5 place-items-center rounded-full bg-cic-warn text-[9px] leading-none text-white ring-2 ring-white">
                        !
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HeatLegend({ mode }: { mode: Mode }) {
  const labels = mode === "score" ? SCORE_STEP_LABELS : TIME_STEP_LABELS;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-cic-muted">
      <span className="font-bold text-black">{mode === "score" ? "Score" : "Time vs. estimate"}:</span>
      {labels.map((l, i) => (
        <span key={l} className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-4 rounded" style={{ backgroundColor: HEAT[i] }} /> {l}
        </span>
      ))}
      {mode === "score" && (
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="grid size-4 place-items-center rounded bg-cic-tint text-[10px] font-bold text-cic-darker">✓</span> Done, not scored
        </span>
      )}
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden className="size-4 rounded border border-dashed border-cic-line" /> Not done
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden className="grid size-4 place-items-center rounded-full bg-cic-warn text-[10px] font-bold text-white">!</span> Worth a look
      </span>
    </div>
  );
}

// ---------- graphs ----------

function DailyChart({ rows, onTip }: { rows: StudentRow[]; onTip: (t: Tip | null) => void }) {
  const days = dailyActivity(rows);
  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((s, d) => s + d.count, 0);
  return (
    <figure>
      <div className="flex h-44 items-end gap-0.5 border-b-2 border-cic-line" onPointerLeave={() => onTip(null)} aria-hidden>
        {days.map((d) => (
          <div
            key={d.day.toISOString()}
            className="group flex h-full flex-1 items-end"
            onPointerMove={(e) =>
              onTip({ x: e.clientX, y: e.clientY, lines: [`${d.count} activit${d.count === 1 ? "y" : "ies"} finished`, d.day.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })] })
            }
          >
            <div
              className="w-full rounded-t bg-cic-dark transition-opacity group-hover:opacity-80"
              style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count ? 4 : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-cic-muted" aria-hidden>
        <span>{days[0].day.toLocaleDateString([], { month: "short", day: "numeric" })}</span>
        <span>Today</span>
      </div>
      <figcaption className="mt-2 text-sm text-cic-muted">
        {total} activities finished in the last 14 days; busiest day had {max === 1 && total === 0 ? 0 : max}.
      </figcaption>
      <table className="sr-only">
        <caption>Activities finished per day</caption>
        <tbody>
          {days.map((d) => (
            <tr key={d.day.toISOString()}>
              <th scope="row">{d.day.toLocaleDateString()}</th>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function ModuleTimeChart({ rows, modules, onTip }: { rows: StudentRow[]; modules: Parameters<typeof moduleTimes>[1]; onTip: (t: Tip | null) => void }) {
  const data = moduleTimes(rows, modules);
  const max = Math.max(1, ...data.map((d) => Math.max(d.medianMins ?? 0, d.estimateMins))) * 1.1;
  return (
    <figure>
      <div className="mb-3 flex gap-4 text-sm text-cic-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-3 w-5 rounded-sm bg-cic-dark" /> Class median
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-4 w-0.5 bg-black" /> Estimate
        </span>
      </div>
      <ul className="space-y-4" onPointerLeave={() => onTip(null)}>
        {data.map((d) => (
          <li
            key={d.module.id}
            onPointerMove={(e) =>
              onTip({
                x: e.clientX,
                y: e.clientY,
                lines: [
                  d.medianMins === null ? "No one has finished yet" : `${Math.round(d.medianMins)} min median`,
                  `Module ${d.module.number}: ${d.module.title}`,
                  `${d.estimateMins} min estimated · ${d.students} student${d.students === 1 ? "" : "s"} finished`,
                ],
              })
            }
          >
            <p className="text-sm font-bold">
              {d.module.number}. {d.module.title}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <div className="relative h-5 flex-1">
                {d.medianMins !== null && (
                  <div className="h-full rounded-r bg-cic-dark" style={{ width: `${(d.medianMins / max) * 100}%` }} />
                )}
                <div aria-hidden className="absolute -top-1 -bottom-1 w-0.5 bg-black" style={{ left: `${(d.estimateMins / max) * 100}%` }} />
              </div>
              <span className="w-28 shrink-0 text-right text-sm tabular-nums">
                {d.medianMins === null ? "—" : `${Math.round(d.medianMins)} min`} <span className="text-cic-muted">/ {d.estimateMins}</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
      <figcaption className="mt-3 text-sm text-cic-muted">Median among students who finished each module. Numbers show median / estimate in minutes.</figcaption>
    </figure>
  );
}

// ---------- student detail ----------

function StudentDetail({ row, cols, onClose }: { row: StudentRow; cols: Column[]; onClose: () => void }) {
  return (
    <Card className="mb-6 border-cic-dark" aria-labelledby="student-detail">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="student-detail" tabIndex={-1} className="text-xl font-bold">
            {name(row.student)}
          </h2>
          <p className="text-sm text-cic-muted">
            {row.done} of {cols.length} activities · {duration(row.totalSecs)} on task · average score {pct(row.avgScore)} · learning gain{" "}
            {signedPct(row.gain)}
          </p>
        </div>
        <Button variant="ghost" onClick={onClose}>
          <X aria-hidden className="size-4" /> Close
        </Button>
      </div>
      {row.done === 0 ? (
        <p className="mt-4">No finished activities yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">Every finished activity for {name(row.student)}</caption>
            <thead>
              <tr className="border-b-2 border-cic-line">
                <th scope="col" className="py-2">Activity</th>
                <th scope="col" className="py-2 text-right">Score</th>
                <th scope="col" className="py-2 text-right">Time / estimate</th>
                <th scope="col" className="py-2 text-right">Tries</th>
                <th scope="col" className="py-2">Finished</th>
                <th scope="col" className="py-2">Worth a look</th>
              </tr>
            </thead>
            <tbody>
              {row.cells.map((cell, i) =>
                cell.result ? (
                  <tr key={cols[i].activity.id} className="border-b border-cic-line last:border-0">
                    <th scope="row" className="py-2 font-normal">
                      <span className="font-bold">M{cols[i].module.number}</span> {cols[i].activity.title}
                    </th>
                    <td className="py-2 text-right tabular-nums">{cell.result.score === undefined ? "—" : pct(cell.result.score)}</td>
                    <td className="py-2 text-right tabular-nums">
                      {minutes(cell.result.secondsOnTask)} / {cols[i].activity.minutes}m
                    </td>
                    <td className="py-2 text-right tabular-nums">{cell.result.attempts}</td>
                    <td className="py-2 whitespace-nowrap">{fmtDate(cell.result.completedAt)}</td>
                    <td className="py-2">
                      {cell.flags.map((f) => (
                        <span key={f.kind} className="mr-1 mb-1 inline-flex items-center gap-1 rounded-full bg-cic-warn-bg px-2 py-0.5 font-bold text-cic-warn" title={f.detail}>
                          <AlertTriangle aria-hidden className="size-3.5" /> {FLAG_LABELS[f.kind]}
                        </span>
                      ))}
                    </td>
                  </tr>
                ) : null,
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ---------- page ----------

export default function TeacherInsights() {
  const { ctx, error } = useTeacherClass();
  const [mode, setMode] = useState<Mode>("score");
  const [tip, setTip] = useState<Tip | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [showAllFlags, setShowAllFlags] = useState(false);

  const view = useMemo(() => {
    if (!ctx) return null;
    const cols = columns(ctx.modules);
    const rows = studentRows(ctx.cls.roster, ctx.progress, ctx.modules);
    return { cols, rows, flags: flaggedItems(rows, ctx.modules) };
  }, [ctx]);

  if (error) return <LoadProblem message={error} />;
  if (ctx === undefined) return <Loading />;
  if (ctx === null || !view) return <NoClasses />;
  const { cls, modules } = ctx;
  const { cols, rows, flags } = view;

  if (cls.roster.length === 0) {
    return (
      <EmptyState title="No students yet" action={<LinkButton href="/teach/roster">Add students</LinkButton>}>
        Insights appear once students start working.
      </EmptyState>
    );
  }

  const allSecs = rows.flatMap((r) => r.cells.flatMap((c) => (c.result ? [c.result.secondsOnTask] : [])));
  const medianSecs = median(allSecs);
  const scores = rows.map((r) => r.avgScore).filter((s): s is number => s !== null);
  const flaggedStudents = new Set(flags.map((f) => f.student.id)).size;
  const pickedRow = rows.find((r) => r.student.id === picked);
  const byFlags = [...rows].sort((a, b) => b.flagCount - a.flagCount || a.student.firstName.localeCompare(b.student.firstName));

  const pick = (id: string) => {
    setPicked(id);
    requestAnimationFrame(() => {
      const el = document.getElementById("student-detail");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    });
  };

  return (
    <div>
      <Tooltip tip={tip} />
      <PageTitle title="Insights" subtitle={`${cls.name} · time, scores and anything worth a second look`} />

      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard Icon={Clock} label="Class time on task" value={duration(allSecs.reduce((a, b) => a + b, 0))} note={`${allSecs.length} activities finished`} />
        <KpiCard Icon={Timer} label="Typical time per activity" value={medianSecs === null ? "—" : minutes(medianSecs)} note="Median, all activities" />
        <KpiCard Icon={Gauge} label="Average score" value={pct(scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null)} note="Quizzes, checks and code" />
        <KpiCard Icon={Flag} label="Worth a look" value={String(flags.length)} note={`${flaggedStudents} student${flaggedStudents === 1 ? "" : "s"}`} />
      </div>

      {pickedRow && (
        <div className="mt-6">
          <StudentDetail row={pickedRow} cols={cols} onClose={() => setPicked(null)} />
        </div>
      )}

      <Card className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Heat map: every student, every activity</h2>
            <p className="text-sm text-cic-muted">Hover a square for details, or pick a name to see everything for that student.</p>
          </div>
          <div role="group" aria-label="Show in heat map" className="inline-flex rounded-xl border-2 border-cic-dark p-0.5">
            {(["score", "time"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={cx("min-h-10 rounded-lg px-4 font-bold", mode === m ? "bg-cic-dark text-white" : "text-cic-dark hover:bg-cic-tint")}
              >
                {m === "score" ? "Score" : "Time on task"}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <HeatMap rows={rows} cols={cols} mode={mode} onTip={setTip} onPick={pick} />
        </div>
        <HeatLegend mode={mode} />
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold">Activities finished per day</h2>
          <p className="mb-4 text-sm text-cic-muted">Last 14 days, whole class.</p>
          <DailyChart rows={rows} onTip={setTip} />
        </Card>
        <Card>
          <h2 className="text-xl font-bold">Time per module</h2>
          <p className="mb-4 text-sm text-cic-muted">Is the class moving faster or slower than planned?</p>
          <ModuleTimeChart rows={rows} modules={modules} onTip={setTip} />
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <AlertTriangle aria-hidden className="size-5 text-cic-warn" /> Worth a look
        </h2>
        <p className="text-sm text-cic-muted">
          Flagged when an activity took under {Math.round(RUSHED_SHARE * 100)}% of its expected time, a wrap-up quiz was aced unusually fast or jumped
          far above the warm-up, or {BURST_COUNT}+ activities were finished within {BURST_WINDOW_SECS / 60} minutes. These are conversation
          starters, not proof: a fast student may just know it already.
        </p>
        {flags.length === 0 ? (
          <p className="mt-4">Nothing unusual so far. 👍</p>
        ) : (
          <>
            <ul className="mt-4 divide-y divide-cic-line">
              {(showAllFlags ? flags : flags.slice(0, 8)).map(({ student, column, cell }) => (
                <li key={`${student.id}-${column.activity.id}`} className="flex flex-wrap items-start justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p>
                      <button type="button" onClick={() => pick(student.id)} className="font-bold text-cic-dark underline-offset-2 hover:underline">
                        {name(student)}
                      </button>{" "}
                      · Module {column.module.number}, {column.activity.title}
                    </p>
                    {cell.flags.map((f) => (
                      <p key={f.kind} className="text-sm text-cic-muted">
                        {f.detail}
                      </p>
                    ))}
                  </div>
                  <span className="flex flex-wrap gap-1">
                    {cell.flags.map((f) => (
                      <span key={f.kind} className="inline-flex items-center gap-1 rounded-full bg-cic-warn-bg px-2 py-0.5 text-sm font-bold text-cic-warn">
                        <AlertTriangle aria-hidden className="size-3.5" /> {FLAG_LABELS[f.kind]}
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
            {flags.length > 8 && (
              <Button variant="ghost" className="mt-2" onClick={() => setShowAllFlags((s) => !s)}>
                {showAllFlags ? "Show fewer" : `Show all ${flags.length}`}
              </Button>
            )}
          </>
        )}
      </Card>

      <Card className="mt-6">
        <h2 className="text-xl font-bold">Students at a glance</h2>
        <p className="text-sm text-cic-muted">Students with the most to look at come first. Pick a name for their full breakdown.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <caption className="sr-only">Summary for each student</caption>
            <thead>
              <tr className="border-b-2 border-cic-line">
                <th scope="col" className="py-2">Student</th>
                <th scope="col" className="py-2 text-right">Done</th>
                <th scope="col" className="py-2 text-right">Time on task</th>
                <th scope="col" className="py-2 text-right">Avg. score</th>
                <th scope="col" className="py-2 text-right">Learning gain</th>
                <th scope="col" className="py-2 text-right">Worth a look</th>
                <th scope="col" className="py-2 pl-4">Last active</th>
              </tr>
            </thead>
            <tbody>
              {byFlags.map((r) => (
                  <tr key={r.student.id} className="border-b border-cic-line last:border-0">
                    <th scope="row" className="py-2">
                      <button type="button" onClick={() => pick(r.student.id)} className="font-bold text-cic-dark underline-offset-2 hover:underline">
                        {name(r.student)}
                      </button>
                    </th>
                    <td className="py-2 text-right tabular-nums">
                      {r.done}/{cols.length}
                    </td>
                    <td className="py-2 text-right tabular-nums">{duration(r.totalSecs)}</td>
                    <td className="py-2 text-right tabular-nums">{pct(r.avgScore)}</td>
                    <td className="py-2 text-right tabular-nums">{signedPct(r.gain)}</td>
                    <td className="py-2 text-right">
                      {r.flagCount > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-cic-warn">
                          <AlertTriangle aria-hidden className="size-3.5" /> {r.flagCount}
                        </span>
                      ) : (
                        <span className="text-cic-muted">0</span>
                      )}
                    </td>
                    <td className="py-2 pl-4 whitespace-nowrap">{r.lastActiveAt ? fmtDate(r.lastActiveAt) : "Not started"}</td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
