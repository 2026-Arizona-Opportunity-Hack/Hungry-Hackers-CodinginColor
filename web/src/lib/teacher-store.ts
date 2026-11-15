"use client";

import { CLASS_SELECT, rowsToTeacherData, type ClassRow, type TeacherData } from "./db-mapping";
import { supabaseBrowser } from "./supabase/client";
import type { Classroom, PictureCode, RosterStudent } from "./types";

/**
 * Teacher-side data, read and written with the signed-in teacher's own
 * Supabase session. Row-level security guarantees a teacher only ever gets
 * their own classes back (admins get all), whatever we ask for here.
 */

export const TEACHER_DATA_EVENT = "cic-teacher-data";
export type { TeacherData };

export async function fetchTeacherData(): Promise<TeacherData> {
  const { data, error } = await supabaseBrowser().from("classes").select(CLASS_SELECT).order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return rowsToTeacherData(data as unknown as ClassRow[]);
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
