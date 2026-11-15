"use client";

import { supabaseBrowser } from "./supabase/client";
import type { ActivityResult, Classroom, PictureCode, RosterStudent, StudentProgress } from "./types";

/**
 * Teacher-side data, read and written with the signed-in teacher's own
 * Supabase session. Row-level security guarantees a teacher only ever gets
 * their own classes back (admins get all), whatever we ask for here.
 */

export const TEACHER_DATA_EVENT = "cic-teacher-data";

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

interface ClassRow {
  id: string;
  name: string;
  school: string;
  teacher_name: string;
  code: string;
  course_id: string;
  assigned_module_ids: string[];
  created_at: string;
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

export async function fetchTeacherData(): Promise<TeacherData> {
  const { data, error } = await supabaseBrowser()
    .from("classes")
    .select(
      "id, name, school, teacher_name, code, course_id, assigned_module_ids, created_at, " +
        "roster_students(id, first_name, last_initial, picture_code, last_active_at, streak_days, " +
        "activity_results(activity_id, completed_at, score, attempts, seconds_on_task, response), " +
        "failed_checks(activity_id, count))",
    )
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const rows = data as unknown as ClassRow[];

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

function notify() {
  window.dispatchEvent(new Event(TEACHER_DATA_EVENT));
}

// No look-alike characters (0/O, 1/I) so codes are easy to read aloud.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function newClassCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return code;
}

function rosterRows(classId: string, students: RosterStudent[]) {
  return students.map((s) => ({
    class_id: classId,
    first_name: s.firstName,
    last_initial: s.lastInitial,
    picture_code: s.pictureCode,
  }));
}

export interface NewClassInput {
  name: string;
  school: string;
  teacherName: string;
  courseId: string;
  assignedModuleIds: string[];
  roster: RosterStudent[];
}

/** Creates the class and its roster. Retries if the random join code is already taken. */
export async function createClass(input: NewClassInput): Promise<Classroom> {
  const db = supabaseBrowser();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) throw new Error("Please sign in again.");

  let classRow: { id: string; code: string; created_at: string } | null = null;
  for (let attempt = 0; attempt < 5 && !classRow; attempt++) {
    const { data, error } = await db
      .from("classes")
      .insert({
        teacher_id: user.id,
        name: input.name,
        school: input.school,
        teacher_name: input.teacherName,
        code: newClassCode(),
        course_id: input.courseId,
        assigned_module_ids: input.assignedModuleIds,
      })
      .select("id, code, created_at")
      .single();
    if (!error) classRow = data;
    else if (error.code !== "23505") throw new Error(error.message); // 23505 = code already used
  }
  if (!classRow) throw new Error("Couldn't make a unique class code. Please try again.");

  const { data: students, error } = await db
    .from("roster_students")
    .insert(rosterRows(classRow.id, input.roster))
    .select("id, first_name, last_initial, picture_code");
  if (error) {
    await db.from("classes").delete().eq("id", classRow.id); // don't leave an empty class behind
    throw new Error(error.message);
  }

  notify();
  return {
    id: classRow.id,
    name: input.name,
    school: input.school,
    teacherName: input.teacherName,
    code: classRow.code,
    courseId: input.courseId,
    assignedModuleIds: input.assignedModuleIds,
    createdAt: classRow.created_at,
    roster: (students as { id: string; first_name: string; last_initial: string; picture_code: string[] }[]).map((s) => ({
      id: s.id,
      firstName: s.first_name,
      lastInitial: s.last_initial,
      pictureCode: s.picture_code as PictureCode,
    })),
  };
}

export async function addStudents(classId: string, students: RosterStudent[]) {
  const { error } = await supabaseBrowser().from("roster_students").insert(rosterRows(classId, students));
  if (error) throw new Error(error.message);
  notify();
}

export async function signOutTeacher() {
  await supabaseBrowser().auth.signOut();
}
