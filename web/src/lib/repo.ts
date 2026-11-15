"use client";

import { useEffect, useState } from "react";
import { introAiCourse } from "./curriculum/intro-ai";
import { supabaseBrowserFor } from "./supabase/client";
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

/**
 * Starts as the course that ships in code, then is replaced by the published
 * copy from /api/curriculum (see CurriculumLoader), so edits made in the admin
 * curriculum editor reach every screen. Falls back to the code course if that
 * request fails.
 */
let COURSES: Course[] = [introAiCourse];
let COURSES_JSON = "";
/** True once the first /api/curriculum request has finished (or failed and we fell back to the code course). */
let CURRICULUM_READY = false;
const CURRICULUM_EVENT = "cic-curriculum";
/** Tabs in the same browser tell each other when an admin publishes, so open screens refresh right away. */
export const CURRICULUM_CHANNEL = "cic-curriculum";

export function setCourses(courses: Course[]) {
  if (courses.length === 0) return markCurriculumReady();
  const json = JSON.stringify(courses);
  // Polling returns the same content most of the time; don't re-render every screen for nothing.
  if (json === COURSES_JSON) return markCurriculumReady();
  COURSES = courses;
  COURSES_JSON = json;
  CURRICULUM_READY = true;
  window.dispatchEvent(new Event(CURRICULUM_EVENT));
  window.dispatchEvent(new Event(EVENT));
}

export function markCurriculumReady() {
  if (CURRICULUM_READY) return;
  CURRICULUM_READY = true;
  window.dispatchEvent(new Event(CURRICULUM_EVENT));
}

/** Tells other open tabs that the published curriculum changed. */
export function announceCurriculumChange() {
  try {
    const ch = new BroadcastChannel(CURRICULUM_CHANNEL);
    ch.postMessage("changed");
    ch.close();
  } catch {
    /* older browsers: the other tabs catch up on focus or the next poll */
  }
}

/** False until the live curriculum has loaded, so screens don't flash "module not found" for brand-new modules. */
export function useCurriculumReady(): boolean {
  useCurriculumVersion();
  return CURRICULUM_READY;
}

/** Re-renders the caller when the published curriculum arrives or changes. Returns a version to use in effect/memo deps. */
export function useCurriculumVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(CURRICULUM_EVENT, bump);
    return () => window.removeEventListener(CURRICULUM_EVENT, bump);
  }, []);
  return version;
}

/** The current course list, kept fresh. */
export function useCourses(): Course[] {
  useCurriculumVersion();
  return COURSES;
}

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

/** True for a class that lives in Supabase, whose progress is synced through /api/progress. */
function isServerClass(classId: string): boolean {
  return read<Classroom | null>(KEY_JOINED, null)?.id === classId && !getClasses().some((c) => c.id === classId);
}

/**
 * Saves progress to the server in the background. The local copy is already
 * written, so the screen never waits on the network.
 */
function sendProgress(body: Record<string, unknown>) {
  fetch("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {
    /* offline: kept locally */
  });
}

/** After joining a Supabase class, load the student's saved progress so it follows them across devices. */
export async function loadServerProgress(): Promise<void> {
  try {
    const res = await fetch("/api/progress");
    if (!res.ok) return;
    const { classId, progress } = (await res.json()) as { classId: string; progress: StudentProgress };
    write(keyProgress(classId, progress.studentId), progress);
  } catch {
    /* offline: start from what this browser has */
  }
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
  return { studentId, results: {}, lastActiveAt: null, failedChecks: {}, streakDays: 0, skippedIds: [] };
}

export function getStudentProgress(classId: string, studentId: string): StudentProgress {
  const seeded = classId === demoClass.id ? demoProgress()[studentId] : undefined;
  const found = read<StudentProgress | null>(keyProgress(classId, studentId), null) ?? seeded ?? emptyProgress(studentId);
  // Progress saved before the skip feature has no skippedIds — normalize here
  // so no caller has to guard against undefined.
  return { ...found, skippedIds: found.skippedIds ?? [] };
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
    // Finishing an activity removes it from the skip list.
    skippedIds: (p.skippedIds ?? []).filter((id) => id !== result.activityId),
    lastActiveAt: new Date().toISOString(),
    streakDays,
  } satisfies StudentProgress);
  if (isServerClass(classId)) {
    sendProgress({
      type: "result",
      activityId: result.activityId,
      score: result.score,
      attempts: result.attempts,
      secondsOnTask: result.secondsOnTask,
      response: result.response,
    });
  }
}

/**
 * Skip an activity for later. It still counts as NOT done, but it no longer
 * blocks the activities after it — the student can come back to it from the
 * "come back to" list in the lesson or the stepper. Stored on the device only:
 * there's no secret here, and syncing would need a schema migration.
 */
export function skipActivity(classId: string, studentId: string, activityId: string) {
  const p = getStudentProgress(classId, studentId);
  if (p.results[activityId] || p.skippedIds?.includes(activityId)) return;
  write(keyProgress(classId, studentId), {
    ...p,
    skippedIds: [...(p.skippedIds ?? []), activityId],
    lastActiveAt: new Date().toISOString(),
  } satisfies StudentProgress);
}

/** Undo a skip: the activity goes back to being the student's current step. */
export function unskipActivity(classId: string, studentId: string, activityId: string) {
  const p = getStudentProgress(classId, studentId);
  if (!p.skippedIds?.includes(activityId)) return;
  write(keyProgress(classId, studentId), {
    ...p,
    skippedIds: p.skippedIds.filter((id) => id !== activityId),
    lastActiveAt: new Date().toISOString(),
  } satisfies StudentProgress);
}

export function recordFailedCheck(classId: string, studentId: string, activityId: string) {
  const p = getStudentProgress(classId, studentId);
  write(keyProgress(classId, studentId), {
    ...p,
    failedChecks: { ...p.failedChecks, [activityId]: (p.failedChecks[activityId] ?? 0) + 1 },
    lastActiveAt: new Date().toISOString(),
  } satisfies StudentProgress);
  if (isServerClass(classId)) sendProgress({ type: "failed", activityId });
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
  const joined = read<Classroom | null>(KEY_JOINED, null);
  // A self-learner also has a real login: end it too, so "Leave" really signs them out.
  if (joined?.selfPaced) void supabaseBrowserFor("learner").auth.signOut({ scope: "local" });
  if (joined) {
    // End the server session too, so this device can't keep saving as this student.
    fetch("/api/join/student", { method: "DELETE", keepalive: true }).catch(() => {});
    remove(KEY_JOINED);
  }
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
