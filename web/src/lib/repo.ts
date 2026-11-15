"use client";

import { useEffect, useState } from "react";
import { introAiCourse } from "./curriculum/intro-ai";
import { demoClass, demoProgress } from "./demo-data";
import type { ActivityResult, Classroom, Course, StudentProgress } from "./types";

/**
 * Demo data layer. Everything the UI reads or writes goes through this file,
 * so swapping to Supabase later means changing only these functions.
 *
 * Today: seed data + this browser's localStorage. Every storage call is
 * wrapped in try/catch because storage can be blocked (private mode, school
 * device policies) — the app still works, it just won't remember.
 */

const KEY_CLASSES = "cic.classes.v1";
const KEY_SESSION = "cic.session.v1";
const KEY_JOINED = "cic.joined-class.v1";
const keyProgress = (classId: string, studentId: string) => `cic.progress.v1.${classId}.${studentId}`;
const EVENT = "cic-store";

const memory = new Map<string, string>();

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key) ?? memory.get(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    const raw = memory.get(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  }
}

function write(key: string, value: unknown) {
  const raw = JSON.stringify(value);
  memory.set(key, raw);
  try {
    window.localStorage.setItem(key, raw);
  } catch {
    /* storage blocked — keep the in-memory copy */
  }
  window.dispatchEvent(new Event(EVENT));
}

function remove(key: string) {
  memory.delete(key);
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT));
}

// ---------- curriculum ----------

const COURSES: Course[] = [introAiCourse];

export function getCourses(): Course[] {
  return COURSES;
}

export function getCourse(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}

// ---------- classes ----------

/** Classes stored only in this browser (the demo class + any saved locally). */
export function getClasses(): Classroom[] {
  return [demoClass, ...read<Classroom[]>(KEY_CLASSES, [])];
}

export function getClass(id: string): Classroom | undefined {
  const joined = read<Classroom | null>(KEY_JOINED, null);
  return getClasses().find((c) => c.id === id) ?? (joined?.id === id ? joined : undefined);
}

/**
 * Offline fallback for /join: searches local classes only. Classes from
 * Supabase are looked up through /api/join/class instead.
 */
export function findClassByCode(code: string): Classroom | undefined {
  const norm = code.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return getClasses().find((c) => c.code === norm);
}

/**
 * The class a student joined through the server. Its roster holds only that
 * student, so it's kept apart from the local classes used for code lookup.
 */
export function setJoinedClass(cls: Classroom) {
  write(KEY_JOINED, cls);
}

export function saveClass(cls: Classroom) {
  const mine = read<Classroom[]>(KEY_CLASSES, []).filter((c) => c.id !== cls.id);
  write(KEY_CLASSES, [...mine, cls]);
}

export function newClassCode(): string {
  // No look-alike characters (0/O, 1/I) so codes are easy to read aloud.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

// ---------- progress ----------

function emptyProgress(studentId: string): StudentProgress {
  return { studentId, results: {}, lastActiveAt: null, failedChecks: {}, streakDays: 0 };
}

export function getStudentProgress(classId: string, studentId: string): StudentProgress {
  const seeded = classId === demoClass.id ? demoProgress()[studentId] : undefined;
  return read<StudentProgress | null>(keyProgress(classId, studentId), null) ?? seeded ?? emptyProgress(studentId);
}

export function getClassProgress(cls: Classroom): Record<string, StudentProgress> {
  const out: Record<string, StudentProgress> = {};
  for (const s of cls.roster) out[s.id] = getStudentProgress(cls.id, s.id);
  return out;
}

export function recordResult(classId: string, studentId: string, result: ActivityResult) {
  const p = getStudentProgress(classId, studentId);
  const today = new Date().toDateString();
  const lastDay = p.lastActiveAt ? new Date(p.lastActiveAt).toDateString() : null;
  const streakDays = lastDay === today ? Math.max(1, p.streakDays) : p.streakDays + 1;
  write(keyProgress(classId, studentId), {
    ...p,
    results: { ...p.results, [result.activityId]: result },
    lastActiveAt: new Date().toISOString(),
    streakDays,
  } satisfies StudentProgress);
}

export function recordFailedCheck(classId: string, studentId: string, activityId: string) {
  const p = getStudentProgress(classId, studentId);
  write(keyProgress(classId, studentId), {
    ...p,
    failedChecks: { ...p.failedChecks, [activityId]: (p.failedChecks[activityId] ?? 0) + 1 },
    lastActiveAt: new Date().toISOString(),
  } satisfies StudentProgress);
}

export function resetStudentProgress(classId: string, studentId: string) {
  remove(keyProgress(classId, studentId));
}

// ---------- student session (no accounts) ----------

export interface StudentSession {
  classId: string;
  studentId: string;
}

export function getSession(): StudentSession | null {
  return read<StudentSession | null>(KEY_SESSION, null);
}

export function setSession(s: StudentSession) {
  write(KEY_SESSION, s);
}

export function clearSession() {
  remove(KEY_SESSION);
}

// ---------- React binding ----------

/**
 * Re-runs `select` whenever the store changes. Returns `undefined` until the
 * component has mounted, so server and client render the same first frame.
 */
export function useStore<T>(select: () => T): T | undefined {
  const [mounted, setMounted] = useState(false);
  const [, setVersion] = useState(0);
  useEffect(() => {
    setMounted(true);
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(EVENT, bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener(EVENT, bump);
      window.removeEventListener("storage", bump);
    };
  }, []);
  return mounted ? select() : undefined;
}
