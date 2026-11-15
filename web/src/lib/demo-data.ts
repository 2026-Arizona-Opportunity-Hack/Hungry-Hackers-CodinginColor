import { introAiCourse } from "./curriculum/intro-ai";
import { DAY_MS } from "./analytics";
import { pictureCodeFor } from "./picture-codes";
import type { ActivityResult, Classroom, RosterStudent, StudentProgress } from "./types";

/**
 * Seed data for the demo: the "Maryvale cohort". Generated deterministically so
 * every judge sees the same class. Replace with Supabase queries in lib/repo.ts.
 */

const NAMES: [string, string][] = [
  ["Aaliyah", "M"], ["Brian", "T"], ["Carlos", "R"], ["Dirah", "S"], ["Elena", "V"],
  ["Fatima", "A"], ["Gabriel", "O"], ["Hana", "K"], ["Isaiah", "W"], ["Jasmine", "L"],
  ["Kai", "N"], ["Leila", "K"], ["Marcus", "J"], ["Nia", "B"], ["Omar", "H"],
  ["Priya", "D"], ["Quentin", "E"], ["Rosa", "G"], ["Samuel", "C"], ["Tiana", "F"],
  ["Uriel", "P"], ["Valeria", "Q"], ["Xavier", "Y"],
];

/** Jordan is the student we sign in as during the demo — a late joiner with no progress. */
export const DEMO_STUDENT: RosterStudent = {
  id: "mv-jordan",
  firstName: "Jordan",
  lastInitial: "M",
  pictureCode: ["🦊", "🐢", "🦉"],
};

export const DEMO_CLASS_CODE = "MVH3AI";

export const demoClass: Classroom = {
  id: "maryvale-p3",
  name: "Intro to AI — Period 3",
  school: "Maryvale High School",
  code: DEMO_CLASS_CODE,
  courseId: introAiCourse.id,
  teacherName: "Ms. Rivera",
  assignedModuleIds: ["m1", "m2", "m3", "m4"],
  roster: [
    ...NAMES.map(([firstName, lastInitial], i) => ({
      id: `mv-${i}`,
      firstName,
      lastInitial,
      pictureCode: pictureCodeFor(i),
    })),
    DEMO_STUDENT,
  ],
  createdAt: "2026-10-20T16:00:00.000Z",
};

/** Small deterministic PRNG (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** How many activities each seeded student has completed (24 = whole course). */
const COMPLETED = [24, 21, 18, 12, 20, 24, 15, 9, 18, 0, 17, 13, 24, 18, 6, 19, 0, 16, 12, 20, 14, 18, 8];
/** Students who hit the "stuck" rule: index -> reason. */
const STUCK_FAILS: Record<number, number> = { 1: 4, 3: 3, 10: 3 };
const IDLE_DAYS: Record<number, number> = { 7: 5, 14: 4 };
/**
 * Students who raced through one module (index -> module index), so the
 * teacher Insights page has something "worth a look" in the demo:
 * seconds per activity, finished back to back, with a perfect wrap-up quiz.
 */
const RUSHED_MODULE: Record<number, number> = { 5: 2, 19: 1 };

function buildProgress(): Record<string, StudentProgress> {
  const now = Date.now();
  const activities = introAiCourse.modules.flatMap((m) => m.activities);
  const out: Record<string, StudentProgress> = {};

  NAMES.forEach((_, i) => {
    const r = rng(1000 + i * 31);
    const done = COMPLETED[i];
    const results: Record<string, ActivityResult> = {};
    const idle = IDLE_DAYS[i] ?? Math.floor(r() * 2);
    const base = now - idle * DAY_MS;

    activities.slice(0, done).forEach((a, k) => {
      const mod = introAiCourse.modules.find((m) => m.activities.includes(a))!;
      const rushed = RUSHED_MODULE[i] === introAiCourse.modules.indexOf(mod);
      const first = activities.indexOf(mod.activities[0]);
      const completedAt = rushed
        ? new Date(base - (done - first) * 3_600_000 * 6 + (k - first) * 40_000).toISOString()
        : new Date(base - (done - k) * 3_600_000 * 6).toISOString();
      const res: ActivityResult = {
        activityId: a.id,
        completedAt,
        attempts: 1,
        secondsOnTask: rushed ? Math.round(6 + r() * 14) : Math.round(60 * a.minutes * (0.7 + r() * 0.8)),
      };
      if (a.kind === "pretest" || a.kind === "posttest") {
        const pCorrect = rushed && a.kind === "posttest" ? 1 : a.kind === "pretest" ? 0.3 + r() * 0.3 : 0.7 + r() * 0.3;
        const answers = a.questions.map((q) =>
          r() < pCorrect ? q.answerIndex : (q.answerIndex + 1 + Math.floor(r() * 3)) % q.choices.length,
        );
        res.response = answers;
        res.score = answers.filter((x, qi) => x === a.questions[qi].answerIndex).length / a.questions.length;
      }
      if (a.kind === "check") {
        res.attempts = 1 + Math.floor(r() * 2);
        res.score = 1;
      }
      if (a.kind === "code") {
        res.attempts = 1 + Math.floor(r() * 4);
        res.score = 1;
      }
      results[a.id] = res;
    });

    const failedChecks: Record<string, number> = {};
    if (STUCK_FAILS[i] && done < activities.length) failedChecks[activities[done].id] = STUCK_FAILS[i];

    out[`mv-${i}`] = {
      studentId: `mv-${i}`,
      results,
      lastActiveAt: done > 0 ? new Date(base).toISOString() : null,
      failedChecks,
      streakDays: done > 0 && idle === 0 ? 1 + Math.floor(r() * 9) : 0,
      skippedIds: [],
    };
  });
  return out;
}

let cached: Record<string, StudentProgress> | null = null;
export function demoProgress(): Record<string, StudentProgress> {
  if (!cached) cached = buildProgress();
  return cached;
}
