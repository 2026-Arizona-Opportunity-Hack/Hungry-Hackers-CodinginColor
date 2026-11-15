import { classGain, courseProgress, assignedModules, studentGain, studentStatus } from "./analytics";
import { getCourse } from "./repo";
import type { Classroom, StudentProgress } from "./types";

/** One cohort (class) rolled up for grant reports. */
export interface ClassSummary {
  cls: Classroom;
  students: number;
  started: number;
  /** Average share of assigned activities finished, 0..1. */
  completion: number;
  pre: number | null;
  post: number | null;
  /** Average wrap-up minus warm-up, in 0..1 points. */
  gain: number | null;
  /** Students with both a warm-up and a wrap-up score. */
  gainStudents: number;
  stuck: number;
  lastActiveAt: string | null;
  /** Per-student values, so schools and the whole program average fairly. */
  completions: number[];
  gains: { pre: number; post: number }[];
}

export function summarizeClass(cls: Classroom, progress: Record<string, StudentProgress>): ClassSummary {
  const course = getCourse(cls.courseId);
  const modules = course ? assignedModules(course, cls) : [];
  const rows = cls.roster.map((s) => ({ p: progress[s.id], status: studentStatus(progress[s.id], modules).status }));
  const completions = rows.map((r) => courseProgress(r.p, modules));
  const gains = cls.roster
    .map((s) => studentGain(progress[s.id], modules))
    .filter((g) => g.gain !== null)
    .map((g) => ({ pre: g.pre as number, post: g.post as number }));
  const cg = classGain(progress, cls, modules);
  const last = rows.map((r) => r.p?.lastActiveAt).filter((x): x is string => Boolean(x)).sort().at(-1) ?? null;
  return {
    cls,
    students: cls.roster.length,
    started: rows.filter((r) => r.status !== "not-started").length,
    completion: avg(completions) ?? 0,
    pre: cg.pre,
    post: cg.post,
    gain: cg.gain,
    gainStudents: gains.length,
    stuck: rows.filter((r) => r.status === "stuck").length,
    lastActiveAt: last,
    completions,
    gains,
  };
}

export const avg = (xs: number[]): number | null => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);

export interface Rollup {
  classes: number;
  students: number;
  started: number;
  stuck: number;
  completion: number | null;
  pre: number | null;
  post: number | null;
  gain: number | null;
  gainStudents: number;
}

/** Roll several cohorts into one line. Averages are per student, not per class. */
export function rollup(list: ClassSummary[]): Rollup {
  const pre = avg(list.flatMap((c) => c.gains.map((g) => g.pre)));
  const post = avg(list.flatMap((c) => c.gains.map((g) => g.post)));
  return {
    classes: list.length,
    students: list.reduce((n, c) => n + c.students, 0),
    started: list.reduce((n, c) => n + c.started, 0),
    stuck: list.reduce((n, c) => n + c.stuck, 0),
    completion: avg(list.flatMap((c) => c.completions)),
    pre,
    post,
    gain: pre !== null && post !== null ? post - pre : null,
    gainStudents: list.reduce((n, c) => n + c.gainStudents, 0),
  };
}

/** A spreadsheet cell: quoted when needed, and defanged if it could run as a formula. */
function cell(v: string | number | null): string {
  let s = v === null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const pctNum = (x: number | null) => (x === null ? "" : Math.round(x * 100));

/** The grant-report table: one row per cohort. */
export function cohortsCsv(rows: { school: string; city: string; teacher: string; summary: ClassSummary }[]): string {
  const header = [
    "School",
    "City",
    "Class",
    "Class code",
    "Teacher",
    "Students",
    "Students started",
    "Completion %",
    "Warm-up avg %",
    "Wrap-up avg %",
    "Learning gain (points)",
    "Students with a gain",
    "Students needing help",
    "Last active",
  ];
  const lines = rows.map(({ school, city, teacher, summary: s }) =>
    [
      school,
      city,
      s.cls.name,
      s.cls.code,
      teacher,
      s.students,
      s.started,
      pctNum(s.completion),
      pctNum(s.pre),
      pctNum(s.post),
      pctNum(s.gain),
      s.gainStudents,
      s.stuck,
      s.lastActiveAt ? s.lastActiveAt.slice(0, 10) : "",
    ]
      .map(cell)
      .join(","),
  );
  return [header.map(cell).join(","), ...lines].join("\r\n") + "\r\n";
}
