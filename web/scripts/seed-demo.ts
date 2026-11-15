/**
 * Loads the demo data into Supabase. Safe to re-run.
 *
 *   npm run seed:demo
 *
 * Creates:
 *   - a trial teacher with the sample Maryvale class        (public login)
 *   - a trial external reviewer (read-only curriculum)       (public login)
 *   - a trial CIC admin (look-around only: can't publish or add accounts) (public login)
 *   - the owner's real CIC admin, with full powers            (PRIVATE password)
 *   - two more partner schools with their own teachers and cohorts
 *
 * The owner admin password is NOT public: that account can create accounts and
 * publish curriculum. It is generated on first run and printed once. To choose it
 * yourself, set DEMO_ADMIN_PASSWORD in web/.env.local before running.
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in web/.env.local.
 */
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { cohortProgress, cohortRoster, EXTRA_COHORTS } from "../src/lib/demo-cohorts";
import { demoClass, demoProgress } from "../src/lib/demo-data";
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from "../src/lib/demo-accounts";
import type { RosterStudent, StudentProgress } from "../src/lib/types";

export const DEMO_TEACHER_EMAIL = "demo.teacher@example.com";
export const DEMO_TEACHER_PASSWORD = "CICdemo-2026!";
export const DEMO_REVIEWER_EMAIL = "demo.reviewer@example.com";
export const DEMO_REVIEWER_PASSWORD = "CICreview-2026!";
export const OWNER_ADMIN_EMAIL = "cic.admin@example.com";

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

type Role = "teacher" | "admin" | "reviewer";

/**
 * Creates the account if missing. An existing account's password is only reset
 * when one is passed in, so re-running never locks anyone out.
 * The role is set here on the server, never from user-editable metadata.
 */
async function ensureUser(email: string, opts: { role: Role; displayName: string; password?: string; schoolId?: string | null }) {
  const generated = opts.password ? null : randomBytes(12).toString("base64url");
  const created = await db.auth.admin.createUser({ email, password: opts.password ?? generated!, email_confirm: true });
  let id = created.data.user?.id;
  let newPassword = created.data.user ? generated : null;
  if (!id) {
    const list = await db.auth.admin.listUsers({ perPage: 1000 });
    if (list.error) throw new Error(`list users: ${list.error.message}`);
    const existing = list.data.users.find((u) => u.email === email);
    if (!existing) throw new Error(`create ${email}: ${created.error?.message}`);
    id = existing.id;
    if (opts.password) {
      const upd = await db.auth.admin.updateUserById(id, { password: opts.password, email_confirm: true });
      if (upd.error) throw new Error(`update ${email}: ${upd.error.message}`);
    }
    newPassword = null;
  }
  const prof = await db
    .from("profiles")
    .update({ role: opts.role, display_name: opts.displayName, email, school_id: opts.schoolId ?? null })
    .eq("id", id);
  if (prof.error) throw new Error(`profile ${email}: ${prof.error.message}`);
  return { id, newPassword };
}

async function ensureSchool(name: string, city: string): Promise<string> {
  const found = await db.from("schools").select("id").ilike("name", name).maybeSingle();
  if (found.error) throw new Error(`school: ${found.error.message}`);
  if (found.data) return found.data.id;
  const ins = await db.from("schools").insert({ name, city }).select("id").single();
  return must(ins, "insert school").id;
}

interface SeedClass {
  code: string;
  name: string;
  schoolName: string;
  teacherId: string;
  teacherName: string;
  schoolId: string;
  courseId: string;
  assignedModuleIds: string[];
  createdAt: string;
  roster: RosterStudent[];
  progress: Record<string, StudentProgress>;
}

async function seedClass(c: SeedClass) {
  // Re-seeding replaces the class (cascades to roster, results, checks).
  const cleared = await db.from("classes").delete().eq("code", c.code);
  if (cleared.error) throw new Error(`clear ${c.code}: ${cleared.error.message}`);

  const [cls] = must(
    await db
      .from("classes")
      .insert({
        teacher_id: c.teacherId,
        school_id: c.schoolId,
        name: c.name,
        school: c.schoolName,
        teacher_name: c.teacherName,
        code: c.code,
        course_id: c.courseId,
        assigned_module_ids: c.assignedModuleIds,
        created_at: c.createdAt,
      })
      .select("id"),
    `insert class ${c.code}`,
  );

  const rows = must(
    await db
      .from("roster_students")
      .insert(
        c.roster.map((s) => ({
          class_id: cls.id,
          first_name: s.firstName,
          last_initial: s.lastInitial,
          picture_code: s.pictureCode,
          last_active_at: c.progress[s.id]?.lastActiveAt ?? null,
          streak_days: c.progress[s.id]?.streakDays ?? 0,
        })),
      )
      .select("id, first_name, last_initial"),
    "insert roster",
  );

  const dbIdFor = new Map(rows.map((r) => [`${r.first_name}|${r.last_initial}`, r.id as string]));
  const results: object[] = [];
  const fails: object[] = [];
  for (const s of c.roster) {
    const studentId = dbIdFor.get(`${s.firstName}|${s.lastInitial}`)!;
    const p = c.progress[s.id];
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
  if (results.length) {
    const r1 = await db.from("activity_results").insert(results);
    if (r1.error) throw new Error(`insert results: ${r1.error.message}`);
  }
  if (fails.length) {
    const r2 = await db.from("failed_checks").insert(fails);
    if (r2.error) throw new Error(`insert failed checks: ${r2.error.message}`);
  }
  console.log(`  ${c.schoolName} · ${c.name} [${c.code}]: ${rows.length} students, ${results.length} results, ${fails.length} stuck flags`);
}

async function main() {
  console.log("Seeding demo data…");

  // Maryvale (the original sample class).
  const maryvale = await ensureSchool(demoClass.school, "Phoenix");
  const teacher = await ensureUser(DEMO_TEACHER_EMAIL, {
    role: "teacher",
    displayName: demoClass.teacherName,
    password: DEMO_TEACHER_PASSWORD,
    schoolId: maryvale,
  });
  await seedClass({
    code: demoClass.code,
    name: demoClass.name,
    schoolName: demoClass.school,
    teacherId: teacher.id,
    teacherName: demoClass.teacherName,
    schoolId: maryvale,
    courseId: demoClass.courseId,
    assignedModuleIds: demoClass.assignedModuleIds,
    createdAt: demoClass.createdAt,
    roster: demoClass.roster,
    progress: demoProgress(),
  });

  // More partner schools, each with its own teacher (random, unused password).
  for (const [i, co] of EXTRA_COHORTS.entries()) {
    const schoolId = await ensureSchool(co.school.name, co.school.city);
    const t = await ensureUser(co.teacher.email, { role: "teacher", displayName: co.teacher.name, schoolId });
    const prefix = co.code.toLowerCase();
    await seedClass({
      code: co.code,
      name: co.name,
      schoolName: co.school.name,
      teacherId: t.id,
      teacherName: co.teacher.name,
      schoolId,
      courseId: demoClass.courseId,
      assignedModuleIds: demoClass.assignedModuleIds,
      createdAt: co.createdAt,
      roster: cohortRoster(prefix, co),
      progress: cohortProgress(prefix, co, 5000 + i * 101),
    });
  }

  // External reviewer (public trial login: curriculum only, no student data).
  await ensureUser(DEMO_REVIEWER_EMAIL, {
    role: "reviewer",
    displayName: "Dana Whitfield (reviewer)",
    password: DEMO_REVIEWER_PASSWORD,
  });

  // Trial CIC admin (public login, limited by the server: see lib/demo-accounts.ts).
  await ensureUser(DEMO_ADMIN_EMAIL, { role: "admin", displayName: "CIC Admin (demo)", password: DEMO_ADMIN_PASSWORD });

  // The owner's real admin (private password).
  const admin = await ensureUser(OWNER_ADMIN_EMAIL, {
    role: "admin",
    displayName: "CIC Admin",
    password: process.env.DEMO_ADMIN_PASSWORD || undefined,
  });

  console.log("\nTrial logins:");
  console.log(`  Teacher   ${DEMO_TEACHER_EMAIL}  (public, shown on /login)`);
  console.log(`  Reviewer  ${DEMO_REVIEWER_EMAIL}  (public, shown on /login)`);
  console.log(`  Admin     ${DEMO_ADMIN_EMAIL}  (public, look-around only)`);
  console.log(`  Owner     ${OWNER_ADMIN_EMAIL}  (private, full powers)`);
  if (admin.newPassword) console.log(`            password (shown once, save it): ${admin.newPassword}`);
  else console.log("            password unchanged (set DEMO_ADMIN_PASSWORD in .env.local to reset it)");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
