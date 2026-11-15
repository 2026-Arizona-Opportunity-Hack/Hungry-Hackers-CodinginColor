/**
 * Creates (or resets) the demo teacher and loads the sample Maryvale class,
 * roster and student progress into Supabase. Safe to re-run.
 *
 *   npm run seed:demo
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in web/.env.local.
 * The demo login is public on purpose (it is shown on /login) and is a plain
 * `teacher` account with access to the demo class only.
 */
import { createClient } from "@supabase/supabase-js";
import { demoClass, demoProgress } from "../src/lib/demo-data";

export const DEMO_TEACHER_EMAIL = "demo.teacher@example.com";
export const DEMO_TEACHER_PASSWORD = "CICdemo-2026!";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in web/.env.local");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

function must<T>(res: { data: T; error: { message: string } | null }, what: string): NonNullable<T> {
  if (res.error || res.data == null) throw new Error(`${what}: ${res.error?.message ?? "no data"}`);
  return res.data as NonNullable<T>;
}

async function ensureTeacher(): Promise<string> {
  const created = await db.auth.admin.createUser({
    email: DEMO_TEACHER_EMAIL,
    password: DEMO_TEACHER_PASSWORD,
    email_confirm: true,
  });
  if (created.data.user) return created.data.user.id;

  // Already exists: find it and reset the password so the login always works.
  const list = await db.auth.admin.listUsers({ perPage: 1000 });
  if (list.error) throw new Error(`list users: ${list.error.message}`);
  const existing = list.data.users.find((u) => u.email === DEMO_TEACHER_EMAIL);
  if (!existing) throw new Error(`create teacher: ${created.error?.message}`);
  const updated = await db.auth.admin.updateUserById(existing.id, { password: DEMO_TEACHER_PASSWORD, email_confirm: true });
  if (updated.error) throw new Error(`update teacher: ${updated.error.message}`);
  return existing.id;
}

async function main() {
  const teacherId = await ensureTeacher();
  const prof = await db.from("profiles").update({ display_name: demoClass.teacherName, role: "teacher" }).eq("id", teacherId);
  if (prof.error) throw new Error(`profile: ${prof.error.message}`);

  // Re-seeding replaces the demo class (cascades to roster, results, checks).
  const cleared = await db.from("classes").delete().eq("code", demoClass.code);
  if (cleared.error) throw new Error(`clear old demo class: ${cleared.error.message}`);

  const [cls] = must(
    await db
      .from("classes")
      .insert({
        teacher_id: teacherId,
        name: demoClass.name,
        school: demoClass.school,
        teacher_name: demoClass.teacherName,
        code: demoClass.code,
        course_id: demoClass.courseId,
        assigned_module_ids: demoClass.assignedModuleIds,
        created_at: demoClass.createdAt,
      })
      .select("id"),
    "insert class",
  );

  const progress = demoProgress();
  const rows = must(
    await db
      .from("roster_students")
      .insert(
        demoClass.roster.map((s) => ({
          class_id: cls.id,
          first_name: s.firstName,
          last_initial: s.lastInitial,
          picture_code: s.pictureCode,
          last_active_at: progress[s.id]?.lastActiveAt ?? null,
          streak_days: progress[s.id]?.streakDays ?? 0,
        })),
      )
      .select("id, first_name, last_initial"),
    "insert roster",
  );

  const dbIdFor = new Map(rows.map((r) => [`${r.first_name}|${r.last_initial}`, r.id as string]));
  const results: object[] = [];
  const fails: object[] = [];
  for (const s of demoClass.roster) {
    const studentId = dbIdFor.get(`${s.firstName}|${s.lastInitial}`)!;
    const p = progress[s.id];
    if (!p) continue;
    for (const r of Object.values(p.results)) {
      results.push({
        student_id: studentId,
        activity_id: r.activityId,
        completed_at: r.completedAt,
        score: r.score ?? null,
        attempts: r.attempts,
        seconds_on_task: r.secondsOnTask,
        response: r.response ?? null,
      });
    }
    for (const [activityId, count] of Object.entries(p.failedChecks)) {
      fails.push({ student_id: studentId, activity_id: activityId, count });
    }
  }
  const r1 = await db.from("activity_results").insert(results);
  if (r1.error) throw new Error(`insert results: ${r1.error.message}`);
  if (fails.length) {
    const r2 = await db.from("failed_checks").insert(fails);
    if (r2.error) throw new Error(`insert failed checks: ${r2.error.message}`);
  }

  console.log(`Seeded ${demoClass.name}: ${rows.length} students, ${results.length} results, ${fails.length} stuck flags.`);
  console.log(`Teacher login: ${DEMO_TEACHER_EMAIL}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
