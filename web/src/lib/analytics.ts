import type {
  Activity,
  ChoiceQuestion,
  Classroom,
  ConceptTag,
  Course,
  Module,
  StudentProgress,
} from "./types";

export const DAY_MS = 86_400_000;
/** A student is "stuck" after this many wrong check answers on one activity… */
export const STUCK_FAILED_CHECKS = 3;
/** …or after this many days with no activity while a module is unfinished. */
export const STUCK_IDLE_DAYS = 3;

export function assignedModules(course: Course, cls: Classroom): Module[] {
  return cls.assignedModuleIds
    .map((id) => course.modules.find((m) => m.id === id))
    .filter((m): m is Module => Boolean(m));
}

export function isDone(p: StudentProgress | undefined, activityId: string): boolean {
  return Boolean(p?.results[activityId]);
}

/** Skipped for later — still counts as NOT done, but doesn't block what's next. */
export function isSkipped(p: StudentProgress | undefined, activityId: string): boolean {
  return Boolean(p?.skippedIds?.includes(activityId));
}

/** Undone activities in a module that the student skipped and should come back to. */
export function skippedActivities(p: StudentProgress | undefined, m: Module) {
  return m.activities.filter((a) => !isDone(p, a.id) && isSkipped(p, a.id));
}

export function moduleComplete(p: StudentProgress | undefined, m: Module): boolean {
  return m.activities.every((a) => isDone(p, a.id));
}

export function moduleDoneCount(p: StudentProgress | undefined, m: Module): number {
  return m.activities.filter((a) => isDone(p, a.id)).length;
}

/** Modules unlock in sequence: a module opens when the one before it is complete. */
export function moduleUnlocked(p: StudentProgress | undefined, modules: Module[], index: number): boolean {
  return index === 0 || moduleComplete(p, modules[index - 1]);
}

/** Inside a module, activities unlock in order too. */
export function activityUnlocked(p: StudentProgress | undefined, m: Module, activityIndex: number): boolean {
  return activityIndex === 0 || isDone(p, m.activities[activityIndex - 1].id);
}

/**
 * Where should this student pick up? Used for the late-joiner "Start here" banner.
 * Skipped activities don't block: we point at the first undone, unskipped
 * activity — or, when only skipped ones remain, the first skipped one, so
 * "Up next" becomes "come back to this".
 */
export function nextStep(
  p: StudentProgress | undefined,
  modules: Module[],
): { module: Module; activity: Activity; activityIndex: number } | null {
  for (const m of modules) {
    const i = m.activities.findIndex((a) => !isDone(p, a.id) && !isSkipped(p, a.id));
    if (i !== -1) return { module: m, activity: m.activities[i], activityIndex: i };
    const j = m.activities.findIndex((a) => !isDone(p, a.id));
    if (j !== -1) return { module: m, activity: m.activities[j], activityIndex: j };
  }
  return null;
}

export function courseProgress(p: StudentProgress | undefined, modules: Module[]): number {
  const all = modules.flatMap((m) => m.activities);
  if (all.length === 0) return 0;
  return all.filter((a) => isDone(p, a.id)).length / all.length;
}

function scoreOf(p: StudentProgress | undefined, m: Module, kind: "pretest" | "posttest"): number | null {
  const a = m.activities.find((x) => x.kind === kind);
  const r = a ? p?.results[a.id] : undefined;
  return r?.score ?? null;
}

/** Learning gain for one module = post-test score − pretest score (both 0..1). */
export function moduleGain(p: StudentProgress | undefined, m: Module) {
  const pre = scoreOf(p, m, "pretest");
  const post = scoreOf(p, m, "posttest");
  return { pre, post, gain: pre !== null && post !== null ? post - pre : null };
}

/** Average pre, post and gain across the modules a student finished both tests in. */
export function studentGain(p: StudentProgress | undefined, modules: Module[]) {
  const pairs = modules.map((m) => moduleGain(p, m)).filter((g) => g.gain !== null);
  if (pairs.length === 0) return { pre: null, post: null, gain: null, modules: 0 };
  const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const pre = avg(pairs.map((g) => g.pre as number));
  const post = avg(pairs.map((g) => g.post as number));
  return { pre, post, gain: post - pre, modules: pairs.length };
}

export function classGain(progress: Record<string, StudentProgress>, cls: Classroom, modules: Module[]) {
  const gains = cls.roster.map((s) => studentGain(progress[s.id], modules)).filter((g) => g.gain !== null);
  if (gains.length === 0) return { pre: null, post: null, gain: null, students: 0 };
  const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const pre = avg(gains.map((g) => g.pre as number));
  const post = avg(gains.map((g) => g.post as number));
  return { pre, post, gain: post - pre, students: gains.length };
}

export type StudentStatus = "not-started" | "stuck" | "on-track" | "complete";

export interface StatusDetail {
  status: StudentStatus;
  reason: string;
}

export function studentStatus(p: StudentProgress | undefined, modules: Module[], now = Date.now()): StatusDetail {
  const started = p && Object.keys(p.results).length > 0;
  if (!started) return { status: "not-started", reason: "Hasn't opened the first activity yet" };
  const next = nextStep(p, modules);
  if (!next) return { status: "complete", reason: "Finished every assigned module" };
  const fails = p.failedChecks[next.activity.id] ?? 0;
  if (fails >= STUCK_FAILED_CHECKS) {
    return {
      status: "stuck",
      reason: `${fails} wrong tries on "${next.activity.title}" (Module ${next.module.number})`,
    };
  }
  if (p.lastActiveAt) {
    const idle = Math.floor((now - new Date(p.lastActiveAt).getTime()) / DAY_MS);
    if (idle >= STUCK_IDLE_DAYS) {
      return { status: "stuck", reason: `No activity for ${idle} days — paused at Module ${next.module.number}` };
    }
  }
  return { status: "on-track", reason: `Working on Module ${next.module.number}: ${next.activity.title}` };
}

function quizQuestions(m: Module): ChoiceQuestion[] {
  const post = m.activities.find((a) => a.kind === "posttest");
  return post && "questions" in post ? post.questions : [];
}

/**
 * Concept mastery across a class: share of correct answers per concept tag,
 * using each student's most recent quiz (post-test if taken, else pretest).
 */
export function conceptMastery(progress: Record<string, StudentProgress>, cls: Classroom, modules: Module[]) {
  const tally = new Map<ConceptTag, { right: number; total: number }>();
  for (const s of cls.roster) {
    const p = progress[s.id];
    if (!p) continue;
    for (const m of modules) {
      const qs = quizQuestions(m);
      const post = m.activities.find((a) => a.kind === "posttest");
      const pre = m.activities.find((a) => a.kind === "pretest");
      const r = (post && p.results[post.id]) || (pre && p.results[pre.id]);
      const answers = r?.response as number[] | undefined;
      if (!answers) continue;
      qs.forEach((q, i) => {
        const t = tally.get(q.concept) ?? { right: 0, total: 0 };
        t.total += 1;
        if (answers[i] === q.answerIndex) t.right += 1;
        tally.set(q.concept, t);
      });
    }
  }
  return [...tally.entries()]
    .map(([concept, t]) => ({ concept, mastery: t.total ? t.right / t.total : 0, answers: t.total }))
    .sort((a, b) => a.mastery - b.mastery);
}

export function pct(x: number | null | undefined): string {
  return x === null || x === undefined ? "—" : `${Math.round(x * 100)}%`;
}

export function signedPct(x: number | null | undefined): string {
  if (x === null || x === undefined) return "—";
  const v = Math.round(x * 100);
  return `${v > 0 ? "+" : ""}${v} pts`;
}
