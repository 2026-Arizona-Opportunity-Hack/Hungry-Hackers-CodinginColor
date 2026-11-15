import type { ActivityResult, Classroom, PictureCode, StudentProgress } from "./types";

/**
 * Turns database rows into the app's Classroom / StudentProgress shapes.
 * Plain module (no "use client"), so both the browser and API routes use it.
 */

interface ResultRow {
  activity_id: string;
  completed_at: string;
  score: number | null;
  attempts: number;
  seconds_on_task: number;
  response: unknown;
}

interface StudentRow {
  id: string;
  first_name: string;
  last_initial: string;
  picture_code: string[];
  last_active_at: string | null;
  streak_days: number;
  activity_results: ResultRow[];
  failed_checks: { activity_id: string; count: number }[];
}

export interface ClassRow {
  id: string;
  name: string;
  school: string;
  teacher_name: string;
  code: string;
  course_id: string;
  assigned_module_ids: string[];
  created_at: string;
  school_id: string | null;
  teacher_id: string | null;
  self_paced: boolean;
  roster_students: StudentRow[];
}

export interface TeacherData {
  classes: Classroom[];
  /** classId -> studentId -> progress */
  progress: Record<string, Record<string, StudentProgress>>;
}

function toProgress(s: StudentRow): StudentProgress {
  const results: Record<string, ActivityResult> = {};
  for (const r of s.activity_results) {
    results[r.activity_id] = {
      activityId: r.activity_id,
      completedAt: r.completed_at,
      score: r.score ?? undefined,
      attempts: r.attempts,
      secondsOnTask: r.seconds_on_task,
      response: r.response ?? undefined,
    };
  }
  return {
    studentId: s.id,
    results,
    lastActiveAt: s.last_active_at,
    failedChecks: Object.fromEntries(s.failed_checks.map((f) => [f.activity_id, f.count])),
    streakDays: s.streak_days,
  };
}

/** The nested select that loads classes with their roster, results and failed checks. */
export const CLASS_SELECT =
  "id, name, school, teacher_name, code, course_id, assigned_module_ids, created_at, school_id, teacher_id, self_paced, " +
  "roster_students(id, first_name, last_initial, picture_code, last_active_at, streak_days, " +
  "activity_results(activity_id, completed_at, score, attempts, seconds_on_task, response), " +
  "failed_checks(activity_id, count))";

export function rowsToTeacherData(rows: ClassRow[]): TeacherData {
  const classes: Classroom[] = [];
  const progress: TeacherData["progress"] = {};
  for (const c of rows) {
    classes.push({
      id: c.id,
      name: c.name,
      school: c.school,
      teacherName: c.teacher_name,
      code: c.code,
      courseId: c.course_id,
      assignedModuleIds: c.assigned_module_ids,
      createdAt: c.created_at,
      schoolId: c.school_id,
      teacherId: c.teacher_id ?? undefined,
      selfPaced: c.self_paced,
      roster: c.roster_students.map((s) => ({
        id: s.id,
        firstName: s.first_name,
        lastInitial: s.last_initial,
        pictureCode: s.picture_code as PictureCode,
      })),
    });
    progress[c.id] = Object.fromEntries(c.roster_students.map((s) => [s.id, toProgress(s)]));
  }
  return { classes, progress };
}
