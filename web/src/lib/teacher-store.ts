"use client";

import { CLASS_SELECT, rowsToTeacherData, type ClassRow, type TeacherData } from "./db-mapping";
import { DEMO_TEACHER_EMAIL } from "./demo-accounts";
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
  const out = rowsToTeacherData(data as unknown as ClassRow[]);
  return (await isDemoTeacher()) ? withSandbox(out) : out;
}

// ---------- demo teacher sandbox ----------
//
// The trial teacher login is shared by everyone trying the app. Its changes
// (new classes, added students) are kept in THIS browser only, never written
// to Supabase, and wiped at every sign-in and sign-out so the next visitor
// sees the original sample class.

const SANDBOX_KEY = "cic.demo-teacher-sandbox.v1";

interface Sandbox {
  classes: Classroom[];
  /** classId -> students added to that class */
  students: Record<string, RosterStudent[]>;
}

/** True when the signed-in teacher is the shared trial account. Reads the local session only, no network. */
export async function isDemoTeacher(): Promise<boolean> {
  const { data } = await supabaseBrowser().auth.getSession();
  return data.session?.user.email?.toLowerCase() === DEMO_TEACHER_EMAIL;
}

function readSandbox(): Sandbox {
  try {
    const raw = window.localStorage.getItem(SANDBOX_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Sandbox>) : {};
    return { classes: Array.isArray(parsed.classes) ? parsed.classes : [], students: parsed.students ?? {} };
  } catch {
    return { classes: [], students: {} };
  }
}

function writeSandbox(s: Sandbox) {
  try {
    window.localStorage.setItem(SANDBOX_KEY, JSON.stringify(s));
  } catch {
    /* storage blocked: the change just won't stick */
  }
}

/** Forget every change made with the trial teacher account in this browser. */
export function clearDemoSandbox() {
  try {
    window.localStorage.removeItem(SANDBOX_KEY);
  } catch {
    /* ignore */
  }
}

function withSandbox(data: TeacherData): TeacherData {
  const box = readSandbox();
  const classes = [...data.classes, ...box.classes].map((c) =>
    box.students[c.id]?.length ? { ...c, roster: [...c.roster, ...box.students[c.id]] } : c,
  );
  const progress = { ...data.progress };
  for (const c of box.classes) progress[c.id] ??= {};
  return { classes, progress };
}

const localId = () => (crypto.randomUUID ? crypto.randomUUID() : `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`);

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
  if (await isDemoTeacher()) {
    const cls: Classroom = {
      id: localId(),
      name: input.name,
      school: input.school,
      teacherName: input.teacherName,
      code: newClassCode(),
      courseId: input.courseId,
      assignedModuleIds: input.assignedModuleIds,
      createdAt: new Date().toISOString(),
      roster: input.roster.map((s) => ({ ...s, id: localId() })),
    };
    const box = readSandbox();
    writeSandbox({ ...box, classes: [...box.classes, cls] });
    notify();
    return cls;
  }

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
  if (await isDemoTeacher()) {
    const box = readSandbox();
    const added = students.map((s) => ({ ...s, id: localId() }));
    writeSandbox({ ...box, students: { ...box.students, [classId]: [...(box.students[classId] ?? []), ...added] } });
    notify();
    return;
  }
  const { error } = await supabaseBrowser().from("roster_students").insert(rosterRows(classId, students));
  if (error) throw new Error(error.message);
  notify();
}

export async function signOutTeacher() {
  clearDemoSandbox();
  // scope "local": end only THIS browser's login. The default would revoke every session of the
  // account, and demo accounts are shared by several people.
  await supabaseBrowser().auth.signOut({ scope: "local" });
}
