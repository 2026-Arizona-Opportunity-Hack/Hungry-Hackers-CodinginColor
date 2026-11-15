import { DAY_MS, isDone, studentGain } from "./analytics";
import type { Activity, ActivityResult, Module, RosterStudent, StudentProgress } from "./types";

/**
 * Teacher insights built only from data the app already saves per activity
 * (score, seconds on task, attempts, completed at). Pure functions, so the
 * rules below are easy to read, test and tune.
 *
 * "Worth a look" flags are prompts for a conversation, never proof of
 * cheating: a fast student may simply know the material.
 */

export interface Column {
  module: Module;
  activity: Activity;
}

export function columns(modules: Module[]): Column[] {
  return modules.flatMap((module) => module.activities.map((activity) => ({ module, activity })));
}

// ---------- "worth a look" rules ----------

/** Finished in under this share of the estimated time. */
export const RUSHED_SHARE = 0.2;
/** Never call anything under this "rushed"; under this is always rushed. */
const RUSHED_FLOOR_SECS = 10;
/** Wrap-up scored this high in under this share of the estimate. */
const FAST_PERFECT_SCORE = 0.9;
const FAST_PERFECT_SHARE = 0.35;
/** Wrap-up beat the warm-up by this much (0.5 = 50 points) ... */
const BIG_JUMP = 0.5;
/** ... while taking under this share of the estimate. */
const BIG_JUMP_SHARE = 0.5;
/** This many activities finished within BURST_WINDOW_SECS of each other. */
export const BURST_COUNT = 4;
export const BURST_WINDOW_SECS = 120;

export type FlagKind = "rushed" | "fast-perfect" | "big-jump" | "burst";

export const FLAG_LABELS: Record<FlagKind, string> = {
  rushed: "Very fast",
  "fast-perfect": "Fast perfect score",
  "big-jump": "Big score jump",
  burst: "Many done at once",
};

export interface Flag {
  kind: FlagKind;
  /** Plain-language reason a teacher can read. */
  detail: string;
}

export const minutes = (secs: number) => (secs < 60 ? `${Math.round(secs)}s` : `${Math.round(secs / 60)}m`);

/** Longer totals: "45m", "2h 10m". */
export function duration(secs: number): string {
  if (secs < 3600) return minutes(secs);
  const h = Math.floor(secs / 3600);
  const m = Math.round((secs % 3600) / 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}

const estimateSecs = (a: Activity) => a.minutes * 60;

function flagsFor(a: Activity, r: ActivityResult, p: StudentProgress, module: Module, burstIds: Set<string>): Flag[] {
  const out: Flag[] = [];
  const est = estimateSecs(a);
  const secs = r.secondsOnTask;

  if (secs < RUSHED_FLOOR_SECS || secs < est * RUSHED_SHARE) {
    out.push({ kind: "rushed", detail: `Finished in ${minutes(secs)}; about ${a.minutes} min expected.` });
  }
  if (a.kind === "posttest" && (r.score ?? 0) >= FAST_PERFECT_SCORE && secs < est * FAST_PERFECT_SHARE) {
    out.push({ kind: "fast-perfect", detail: `Scored ${Math.round((r.score ?? 0) * 100)}% in ${minutes(secs)}.` });
  }
  if (a.kind === "posttest") {
    const pre = module.activities.find((x) => x.kind === "pretest");
    const preScore = pre ? p.results[pre.id]?.score : undefined;
    if (preScore !== undefined && r.score !== undefined && r.score - preScore >= BIG_JUMP && secs < est * BIG_JUMP_SHARE) {
      out.push({
        kind: "big-jump",
        detail: `Warm-up ${Math.round(preScore * 100)}% → wrap-up ${Math.round(r.score * 100)}% in only ${minutes(secs)}.`,
      });
    }
  }
  if (burstIds.has(a.id)) {
    out.push({ kind: "burst", detail: `One of ${BURST_COUNT}+ activities finished within ${BURST_WINDOW_SECS / 60} minutes.` });
  }
  return out;
}

/** Activity ids finished in a burst: BURST_COUNT or more inside a BURST_WINDOW_SECS window. */
function burstActivityIds(p: StudentProgress): Set<string> {
  const done = Object.values(p.results)
    .map((r) => ({ id: r.activityId, t: new Date(r.completedAt).getTime() }))
    .filter((x) => Number.isFinite(x.t))
    .sort((a, b) => a.t - b.t);
  const ids = new Set<string>();
  let start = 0;
  for (let end = 0; end < done.length; end++) {
    while (done[end].t - done[start].t > BURST_WINDOW_SECS * 1000) start++;
    if (end - start + 1 >= BURST_COUNT) for (let k = start; k <= end; k++) ids.add(done[k].id);
  }
  return ids;
}

// ---------- the grid ----------

export interface Cell {
  done: boolean;
  result?: ActivityResult;
  flags: Flag[];
  /** Time compared with the estimate: 1 = right on, 2 = twice as long. */
  timeRatio?: number;
}

export interface StudentRow {
  student: RosterStudent;
  cells: Cell[];
  done: number;
  totalSecs: number;
  /** Mean score over scored activities, or null if none yet. */
  avgScore: number | null;
  /** Wrap-up minus warm-up across finished modules, or null. */
  gain: number | null;
  flagCount: number;
  lastActiveAt: string | null;
}

export function studentRows(roster: RosterStudent[], progress: Record<string, StudentProgress>, modules: Module[]): StudentRow[] {
  const cols = columns(modules);
  return roster.map((student) => {
    const p = progress[student.id] ?? { studentId: student.id, results: {}, lastActiveAt: null, failedChecks: {}, streakDays: 0 };
    const bursts = burstActivityIds(p);
    const cells = cols.map(({ module, activity }): Cell => {
      const result = p.results[activity.id];
      if (!result || !isDone(p, activity.id)) return { done: false, flags: [] };
      return {
        done: true,
        result,
        flags: flagsFor(activity, result, p, module, bursts),
        timeRatio: result.secondsOnTask / estimateSecs(activity),
      };
    });
    const doneCells = cells.filter((c) => c.done);
    const scored = doneCells.map((c) => c.result?.score).filter((s): s is number => s !== undefined);
    return {
      student,
      cells,
      done: doneCells.length,
      totalSecs: doneCells.reduce((s, c) => s + (c.result?.secondsOnTask ?? 0), 0),
      avgScore: scored.length ? scored.reduce((a, b) => a + b, 0) / scored.length : null,
      gain: studentGain(p, modules).gain,
      flagCount: cells.reduce((n, c) => n + c.flags.length, 0),
      lastActiveAt: p.lastActiveAt,
    };
  });
}

export interface FlaggedItem {
  student: RosterStudent;
  column: Column;
  cell: Cell;
}

/** Every flagged result, most recent first. */
export function flaggedItems(rows: StudentRow[], modules: Module[]): FlaggedItem[] {
  const cols = columns(modules);
  return rows
    .flatMap((row) =>
      row.cells.flatMap((cell, i) => (cell.flags.length ? [{ student: row.student, column: cols[i], cell }] : [])),
    )
    .sort((a, b) => (b.cell.result?.completedAt ?? "").localeCompare(a.cell.result?.completedAt ?? ""));
}

// ---------- graphs ----------

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export interface ModuleTime {
  module: Module;
  /** Median minutes among students who finished the whole module. */
  medianMins: number | null;
  estimateMins: number;
  students: number;
}

export function moduleTimes(rows: StudentRow[], modules: Module[]): ModuleTime[] {
  const cols = columns(modules);
  return modules.map((module) => {
    const idx = cols.flatMap((c, i) => (c.module === module ? [i] : []));
    const totals = rows
      .filter((r) => idx.every((i) => r.cells[i].done))
      .map((r) => idx.reduce((s, i) => s + (r.cells[i].result?.secondsOnTask ?? 0), 0) / 60);
    return {
      module,
      medianMins: median(totals),
      estimateMins: module.activities.reduce((s, a) => s + a.minutes, 0),
      students: totals.length,
    };
  });
}

export interface DayCount {
  /** Local midnight of the day. */
  day: Date;
  count: number;
}

/** Activities finished per day over the last `days` days, oldest first. */
export function dailyActivity(rows: StudentRow[], days = 14, now = new Date()): DayCount[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const out: DayCount[] = Array.from({ length: days }, (_, i) => ({ day: new Date(today.getTime() - (days - 1 - i) * DAY_MS), count: 0 }));
  for (const row of rows) {
    for (const c of row.cells) {
      if (!c.result) continue;
      const t = new Date(c.result.completedAt);
      const d = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
      const slot = out.findIndex((x) => x.day.getTime() === d);
      if (slot !== -1) out[slot].count++;
    }
  }
  return out;
}

// ---------- heat map colour ----------

/**
 * One-hue green scale, light → dark (validated with the dataviz skill's
 * checker: monotone lightness, visible steps, light end ≥ 2:1 on white).
 * Text on steps 0-2 is black, on 3-4 white; every pair clears 4.5:1.
 */
export const HEAT = ["#76c594", "#46ab72", "#1a8d50", "#006b37", "#004321"] as const;
export const heatText = (step: number) => (step >= 3 ? "#ffffff" : "#000000");

/** 0..1 → step 0..4 (higher is darker). */
export function heatStep(x: number): number {
  return Math.max(0, Math.min(HEAT.length - 1, Math.floor(x * HEAT.length)));
}

/** Time ratio → step: under half the estimate is lightest, 2× or more is darkest. */
export function timeStep(ratio: number): number {
  if (ratio < 0.5) return 0;
  if (ratio < 0.9) return 1;
  if (ratio < 1.3) return 2;
  if (ratio < 2) return 3;
  return 4;
}

export const TIME_STEP_LABELS = ["Under ½ the estimate", "½–0.9×", "About right (0.9–1.3×)", "1.3–2×", "2× or more"];
export const SCORE_STEP_LABELS = ["0–19%", "20–39%", "40–59%", "60–79%", "80–100%"];
