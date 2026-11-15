import { introAiCourse } from "./curriculum/intro-ai";
import { DAY_MS } from "./analytics";
import { rng } from "./demo-data";
import { pictureCodeFor } from "./picture-codes";
import type { ActivityResult, StudentProgress } from "./types";

/**
 * Extra sample cohorts at other partner schools, so the CIC admin view has
 * several schools to compare. Only used by `npm run seed:demo`.
 */
export interface DemoCohort {
  code: string;
  name: string;
  school: { name: string; city: string };
  teacher: { name: string; email: string };
  createdAt: string;
  students: [string, string][];
  /** Activities finished per student (24 = whole course). */
  completed: number[];
  /** student index -> wrong tries on the next check ("stuck" rule). */
  stuck?: Record<number, number>;
  /** student index -> days since last activity. */
  idle?: Record<number, number>;
}

export const EXTRA_COHORTS: DemoCohort[] = [
  {
    code: "PHX4AI",
    name: "Intro to AI — Period 1",
    school: { name: "Camelback High School", city: "Phoenix" },
    teacher: { name: "Mr. Okafor", email: "teacher.camelback@example.com" },
    createdAt: "2026-10-27T16:00:00.000Z",
    students: [["Amara", "D"], ["Beto", "L"], ["Chloe", "W"], ["Dev", "P"], ["Esme", "R"], ["Felix", "T"], ["Grace", "N"], ["Hugo", "S"], ["Ivy", "M"], ["Jonah", "K"], ["Kira", "B"], ["Luca", "V"], ["Mina", "O"], ["Nate", "Z"]],
    completed: [24, 24, 20, 18, 12, 24, 16, 22, 9, 14, 24, 7, 19, 0],
    stuck: { 4: 3 },
    idle: { 8: 4 },
  },
  {
    code: "TMP7AI",
    name: "AI Club",
    school: { name: "Tempe Prep Academy", city: "Tempe" },
    teacher: { name: "Ms. Nguyen", email: "teacher.tempe@example.com" },
    createdAt: "2026-11-03T16:00:00.000Z",
    students: [["Aiden", "F"], ["Bella", "H"], ["Caleb", "J"], ["Dara", "Q"], ["Eli", "U"], ["Faye", "Y"], ["Gil", "C"], ["Hana", "E"], ["Ian", "A"], ["Juno", "G"], ["Kofi", "X"]],
    completed: [12, 9, 18, 6, 15, 12, 3, 20, 10, 0, 8],
    stuck: { 6: 4 },
    idle: { 3: 5 },
  },
];

export function cohortProgress(prefix: string, cohort: DemoCohort, seedBase: number): Record<string, StudentProgress> {
  const now = Date.now();
  const activities = introAiCourse.modules.flatMap((m) => m.activities);
  const out: Record<string, StudentProgress> = {};
  cohort.students.forEach((_, i) => {
    const r = rng(seedBase + i * 37);
    const done = cohort.completed[i] ?? 0;
    const idle = cohort.idle?.[i] ?? Math.floor(r() * 2);
    const base = now - idle * DAY_MS;
    const results: Record<string, ActivityResult> = {};
    activities.slice(0, done).forEach((a, k) => {
      const res: ActivityResult = {
        activityId: a.id,
        completedAt: new Date(base - (done - k) * 3_600_000 * 6).toISOString(),
        attempts: 1,
        secondsOnTask: Math.round(60 * a.minutes * (0.7 + r() * 0.8)),
      };
      if (a.kind === "pretest" || a.kind === "posttest") {
        const pCorrect = a.kind === "pretest" ? 0.25 + r() * 0.3 : 0.65 + r() * 0.3;
        const answers = a.questions.map((q) => (r() < pCorrect ? q.answerIndex : (q.answerIndex + 1 + Math.floor(r() * 3)) % q.choices.length));
        res.response = answers;
        res.score = answers.filter((x, qi) => x === a.questions[qi].answerIndex).length / a.questions.length;
      }
      if (a.kind === "check" || a.kind === "code") {
        res.attempts = 1 + Math.floor(r() * 3);
        res.score = 1;
      }
      results[a.id] = res;
    });
    const failedChecks: Record<string, number> = {};
    if (cohort.stuck?.[i] && done < activities.length) failedChecks[activities[done].id] = cohort.stuck[i];
    out[`${prefix}-${i}`] = {
      studentId: `${prefix}-${i}`,
      results,
      lastActiveAt: done > 0 ? new Date(base).toISOString() : null,
      failedChecks,
      streakDays: done > 0 && idle === 0 ? 1 + Math.floor(r() * 7) : 0,
    };
  });
  return out;
}

export const cohortRoster = (prefix: string, cohort: DemoCohort) =>
  cohort.students.map(([firstName, lastInitial], i) => ({ id: `${prefix}-${i}`, firstName, lastInitial, pictureCode: pictureCodeFor(i + 3) }));
