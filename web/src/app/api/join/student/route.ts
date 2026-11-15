import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { DEMO_CLASS_CODE } from "@/lib/demo-data";
import { PICTURES, sameCode } from "@/lib/picture-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { STUDENT_COOKIE, hashToken } from "@/lib/supabase/student-session";

/**
 * Student step 2: check the three-picture code on the server.
 *
 * There are only 9^3 = 729 picture codes, so wrong guesses are recorded in
 * join_attempts and the route locks out after too many misses, per student
 * and per client. On success the student gets a random session token in an
 * httpOnly cookie; only its hash is stored in student_sessions.
 */

const WINDOW_MINUTES = 15;
const MAX_FAILS_PER_STUDENT = 5;
const MAX_FAILS_PER_CLIENT = 20;
const SESSION_DAYS = 30;

function clientKey(request: Request): string {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  return createHash("sha256").update(`join:${ip}`).digest("hex");
}

/** "Leave": ends this device's student session. */
export async function DELETE(request: Request) {
  const token = request.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${STUDENT_COOKIE}=([^;]+)`))?.[1];
  const db = supabaseAdmin();
  if (db && token) await db.from("student_sessions").delete().eq("token_hash", hashToken(decodeURIComponent(token)));
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(STUDENT_COOKIE);
  return res;
}

export async function POST(request: Request) {
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const body = (await request.json().catch(() => null)) as { classId?: unknown; studentId?: unknown; pictureCode?: unknown } | null;
  const classId = typeof body?.classId === "string" ? body.classId : "";
  const studentId = typeof body?.studentId === "string" ? body.studentId : "";
  const picked = Array.isArray(body?.pictureCode) ? body.pictureCode : [];
  const valid = new Set(PICTURES.map((p) => p.emoji));
  if (!classId || !studentId || picked.length !== 3 || !picked.every((e) => typeof e === "string" && valid.has(e))) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { data: row, error } = await db
    .from("roster_students")
    .select(
      "id, first_name, last_initial, picture_code, user_id, " +
        "classes!inner(id, name, school, teacher_name, code, course_id, assigned_module_ids, created_at, self_paced)",
    )
    .eq("id", studentId)
    .eq("class_id", classId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "server_error" }, { status: 500 });
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  // Learners with their own accounts sign in with email and password, never a picture code.
  const owned = row as unknown as { user_id: string | null; classes: { self_paced: boolean } };
  if (owned.user_id || owned.classes.self_paced) return NextResponse.json({ error: "not_found" }, { status: 404 });
  // The shared sample class runs in the browser only (see /api/join/class).
  if ((row as unknown as { classes: { code: string } }).classes.code === DEMO_CLASS_CODE) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const student = row as unknown as {
    id: string;
    first_name: string;
    last_initial: string;
    picture_code: string[];
    classes: {
      id: string;
      name: string;
      school: string;
      teacher_name: string;
      code: string;
      course_id: string;
      assigned_module_ids: string[];
      created_at: string;
    };
  };

  // Lockout check before comparing, so a locked-out guesser learns nothing.
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const client = clientKey(request);
  const [byStudent, byClient] = await Promise.all([
    db.from("join_attempts").select("id", { count: "exact", head: true }).eq("student_id", student.id).eq("succeeded", false).gte("created_at", since),
    db.from("join_attempts").select("id", { count: "exact", head: true }).eq("client_key", client).eq("succeeded", false).gte("created_at", since),
  ]);
  if (byStudent.error || byClient.error) return NextResponse.json({ error: "server_error" }, { status: 500 });
  if ((byStudent.count ?? 0) >= MAX_FAILS_PER_STUDENT || (byClient.count ?? 0) >= MAX_FAILS_PER_CLIENT) {
    return NextResponse.json({ error: "locked" }, { status: 429 });
  }

  const ok = sameCode(picked as string[], student.picture_code);
  await db.from("join_attempts").insert({ student_id: student.id, client_key: client, succeeded: ok });
  if (!ok) return NextResponse.json({ error: "wrong_code" }, { status: 401 });

  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const { error: sessionError } = await db
    .from("student_sessions")
    .insert({ token_hash: hashToken(token), student_id: student.id, expires_at: expires.toISOString() });
  if (sessionError) return NextResponse.json({ error: "server_error" }, { status: 500 });

  const c = student.classes;
  // The browser caches this class for the student screens. The roster holds only
  // this student, so no one else's name or picture code is sent.
  const res = NextResponse.json({
    id: c.id,
    name: c.name,
    school: c.school,
    teacherName: c.teacher_name,
    code: c.code,
    courseId: c.course_id,
    assignedModuleIds: c.assigned_module_ids,
    createdAt: c.created_at,
    roster: [{ id: student.id, firstName: student.first_name, lastInitial: student.last_initial, pictureCode: student.picture_code }],
  });
  res.cookies.set(STUDENT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
  return res;
}
