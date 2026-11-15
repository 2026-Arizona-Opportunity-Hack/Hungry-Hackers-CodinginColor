import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only. Students have no accounts: after the picture-code check,
 * /api/join/student sets a random token in this httpOnly cookie and stores
 * only its sha256 hash in student_sessions.
 */
export const STUDENT_COOKIE = "cic_student";

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

export interface SignedInStudent {
  studentId: string;
  classId: string;
  courseId: string;
}

/** The student behind this request's session cookie, or null if missing or expired. */
export async function studentFromRequest(db: SupabaseClient, request: Request): Promise<SignedInStudent | null> {
  const token = readCookie(request, STUDENT_COOKIE);
  if (!token) return null;
  const { data } = await db
    .from("student_sessions")
    .select("student_id, expires_at, roster_students!inner(class_id, classes!inner(course_id))")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (!data || new Date(data.expires_at as string) <= new Date()) return null;
  const s = data.roster_students as unknown as { class_id: string; classes: { course_id: string } };
  return { studentId: data.student_id as string, classId: s.class_id, courseId: s.classes.course_id };
}
