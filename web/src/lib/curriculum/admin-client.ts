"use client";

import { setCourses } from "../repo";
import type { Activity, ActivityKind, ChoiceQuestion, Course, Module } from "../types";

export interface CurriculumState {
  courseId: string;
  draft: Course;
  published: Course;
  draftVersion: number;
  publishedVersion: number;
  publishedAt: string;
  /** The draft differs from what students see. */
  dirty: boolean;
  /** What still blocks publishing (incomplete steps). Empty = ready. */
  publishErrors: string[];
}

export class CurriculumError extends Error {
  constructor(
    message: string,
    public problems: string[] = [],
  ) {
    super(message);
  }
}

async function call<T>(method: "GET" | "PUT" | "POST", body?: unknown, query = ""): Promise<T> {
  const res = await fetch(`/api/admin/curriculum${query}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T & { message?: string; errors?: string[] };
  if (!res.ok) throw new CurriculumError(data.message ?? "Something went wrong. Please try again.", data.errors ?? []);
  return data;
}

export const loadCurriculum = () => call<CurriculumState>("GET");

export const saveDraft = (courseId: string, content: Course) =>
  call<{ dirty: boolean; publishErrors: string[]; draftVersion: number }>("PUT", { courseId, content });

export async function publishCourse(courseId: string, assignNew: boolean) {
  const r = await call<{ publishedVersion: number; newModules: number; classesUpdated: number }>("POST", { courseId, action: "publish", assignNew });
  await refreshPublished();
  return r;
}

export const discardDraft = (courseId: string) => call<{ ok: true }>("POST", { courseId, action: "discard" });

/** Re-reads the published course so this browser shows the new version straight away. */
export async function refreshPublished() {
  try {
    const r = await fetch("/api/curriculum", { cache: "no-store" });
    if (r.ok) setCourses(((await r.json()) as { courses: Course[] }).courses);
  } catch {
    /* the next page load picks it up */
  }
}

// ---------- blank templates ----------

export const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

export function blankQuestion(prefix: string): ChoiceQuestion {
  return { id: uid(prefix), prompt: "", choices: ["", ""], answerIndex: 0, concept: "what-is-ai", hint: "", explanation: "" };
}

export function blankActivity(kind: Exclude<ActivityKind, "code">): Activity {
  const id = uid(kind);
  switch (kind) {
    case "pretest":
      return { id, kind, title: "Warm-up quiz", minutes: 3, questions: [blankQuestion("q")] };
    case "posttest":
      return { id, kind, title: "Wrap-up quiz", minutes: 4, questions: [blankQuestion("q")] };
    case "check":
      return { id, kind, title: "Quick check", minutes: 2, questions: [blankQuestion("q")] };
    case "slides":
      return { id, kind, title: "Learn", minutes: 8, slides: [{ title: "", bullets: [""] }] };
    case "worksheet":
      return { id, kind, title: "Practice", minutes: 10, intro: "", fields: [{ id: uid("f"), label: "", kind: "short" }] };
    case "exit":
      return { id, kind, title: "Exit question", minutes: 2, prompt: "", concept: "what-is-ai" };
  }
}

/** A new module with every part the course needs, ready to fill in. */
export function blankModule(): Module {
  return {
    id: uid("m"),
    number: 0,
    title: "New module",
    summary: "",
    activities: (["pretest", "slides", "check", "worksheet", "exit", "posttest"] as const).map(blankActivity),
  };
}
