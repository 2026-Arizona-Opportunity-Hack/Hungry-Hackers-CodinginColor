import { NextResponse } from "next/server";
import { introAiCourse } from "@/lib/curriculum/intro-ai";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { studentFromRequest } from "@/lib/supabase/student-session";
import type { ActivityResult, Course, StudentProgress } from "@/lib/types";

/**
 * A signed-in student's own progress. GET loads it (so it follows them to
 * any device); POST records a finished activity or a wrong answer on a check.
 * Teachers read the same rows through row-level security.
 */

const COURSES: Record<string, Course> = { [introAiCourse.id]: introAiCourse };
const MAX_RESPONSE_CHARS = 20_000;

function activityIds(courseId: string): Set<string> {
  const course = COURSES[courseId];
  return new Set(course ? course.modules.flatMap((m) => m.activities.map((a) => a.id)) : []);
}

const intIn = (v: unknown, min: number, max: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : min;

export async function GET(request: Request) {
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const me = await studentFromRequest(db, request);
  if (!me) return NextResponse.json({ error: "signed_out" }, { status: 401 });

  const [student, results, fails] = await Promise.all([
    db.from("roster_students").select("last_active_at, streak_days").eq("id", me.studentId).single(),
    db.from("activity_results").select("activity_id, completed_at, score, attempts, seconds_on_task, response").eq("student_id", me.studentId),
    db.from("failed_checks").select("activity_id, count").eq("student_id", me.studentId),
  ]);
  if (student.error || results.error || fails.error) return NextResponse.json({ error: "server_error" }, { status: 500 });

  const progress: StudentProgress = {
    studentId: me.studentId,
    results: Object.fromEntries(
      results.data.map((r) => [
        r.activity_id,
        {
          activityId: r.activity_id,
          completedAt: r.completed_at,
          score: r.score ?? undefined,
          attempts: r.attempts,
          secondsOnTask: r.seconds_on_task,
          response: r.response ?? undefined,
        } satisfies ActivityResult,
      ]),
    ),
    lastActiveAt: student.data.last_active_at,
    failedChecks: Object.fromEntries(fails.data.map((f) => [f.activity_id, f.count])),
    streakDays: student.data.streak_days,
  };
  return NextResponse.json({ classId: me.classId, progress });
}

export async function POST(request: Request) {
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const me = await studentFromRequest(db, request);
  if (!me) return NextResponse.json({ error: "signed_out" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const activityId = typeof body?.activityId === "string" ? body.activityId : "";
  if (!activityIds(me.courseId).has(activityId)) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  if (body?.type === "failed") {
    const { error } = await db.rpc("increment_failed_check", { p_student_id: me.studentId, p_activity_id: activityId });
    if (error) return NextResponse.json({ error: "server_error" }, { status: 500 });
    await touch(db, me.studentId, false);
    return NextResponse.json({ ok: true });
  }

  if (body?.type !== "result") return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const score = typeof body.score === "number" && body.score >= 0 && body.score <= 1 ? body.score : null;
  const response = body.response === undefined ? null : body.response;
  if (JSON.stringify(response).length > MAX_RESPONSE_CHARS) return NextResponse.json({ error: "too_large" }, { status: 413 });

  const { error } = await db.from("activity_results").upsert({
    student_id: me.studentId,
    activity_id: activityId,
    completed_at: new Date().toISOString(),
    score,
    attempts: intIn(body.attempts, 0, 1000),
    seconds_on_task: intIn(body.secondsOnTask, 0, 24 * 60 * 60),
    response,
  });
  if (error) return NextResponse.json({ error: "server_error" }, { status: 500 });
  await touch(db, me.studentId, true);
  return NextResponse.json({ ok: true });
}

/** Marks the student active now; finishing an activity also advances the streak (same rule as the app). */
async function touch(db: NonNullable<ReturnType<typeof supabaseAdmin>>, studentId: string, countsForStreak: boolean) {
  const now = new Date();
  const update: { last_active_at: string; streak_days?: number } = { last_active_at: now.toISOString() };
  if (countsForStreak) {
    const { data } = await db.from("roster_students").select("last_active_at, streak_days").eq("id", studentId).single();
    if (data) {
      const sameDay = data.last_active_at && new Date(data.last_active_at).toDateString() === now.toDateString();
      update.streak_days = sameDay ? Math.max(1, data.streak_days) : data.streak_days + 1;
    }
  }
  await db.from("roster_students").update(update).eq("id", studentId);
}
