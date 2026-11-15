import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { PICTURES } from "@/lib/picture-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/supabase/server";
import { STUDENT_COOKIE, hashToken } from "@/lib/supabase/student-session";

/**
 * A signed-in learner asks for their student session. Their roster row in the hidden
 * self-paced class is found (or made) from THEIR login, never from anything in the
 * request. They then get the same httpOnly student cookie that class students get, so
 * the lesson screens and /api/progress work unchanged.
 */

const SESSION_DAYS = 30;

function splitName(display: string): { first: string; initial: string } {
  const parts = display.trim().split(/\s+/).filter(Boolean);
  const first = (parts[0] ?? "Learner").slice(0, 40);
  const initial = parts.length > 1 ? parts[parts.length - 1][0].toUpperCase().slice(0, 2) : "";
  return { first, initial };
}

const randomCode = () => {
  const pick = () => PICTURES[randomBytes(1)[0] % PICTURES.length].emoji;
  return [pick(), pick(), pick()];
};

export async function POST() {
  const auth = await requireRole(["learner"]);
  if ("error" in auth) return auth.error;
  const { db, user } = auth;
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  // The one hidden self-paced class.
  const cls = await db
    .from("classes")
    .select("id, name, course_id, created_at")
    .eq("self_paced", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (cls.error || !cls.data) return NextResponse.json({ error: "server_error" }, { status: 500 });

  // This learner's roster row, made the first time.
  let student = (await db.from("roster_students").select("id, first_name, last_initial, picture_code").eq("user_id", user.id).maybeSingle()).data;
  if (!student) {
    const profile = await db.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
    const { first, initial } = splitName(profile.data?.display_name ?? user.email?.split("@")[0] ?? "Learner");
    const ins = await db
      .from("roster_students")
      .insert({ class_id: cls.data.id, first_name: first, last_initial: initial, picture_code: randomCode(), user_id: user.id })
      .select("id, first_name, last_initial, picture_code")
      .single();
    if (ins.error) {
      // Two tabs signing in at once: the unique user_id means the second insert loses. Use the winner's row.
      const again = await db.from("roster_students").select("id, first_name, last_initial, picture_code").eq("user_id", user.id).maybeSingle();
      if (!again.data) return NextResponse.json({ error: "server_error" }, { status: 500 });
      student = again.data;
    } else {
      student = ins.data;
    }
  }

  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const sess = await db.from("student_sessions").insert({ token_hash: hashToken(token), student_id: student.id, expires_at: expires.toISOString() });
  if (sess.error) return NextResponse.json({ error: "server_error" }, { status: 500 });

  // The browser caches this as the student's class. The hidden class's join code is never sent.
  const res = NextResponse.json({
    id: cls.data.id,
    name: "My learning",
    school: "",
    teacherName: "",
    code: "",
    courseId: cls.data.course_id,
    assignedModuleIds: [],
    createdAt: cls.data.created_at,
    selfPaced: true,
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
