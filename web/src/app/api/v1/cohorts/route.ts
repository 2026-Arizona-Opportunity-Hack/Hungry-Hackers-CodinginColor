import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { rollup, summarizeClass, type ClassSummary } from "@/lib/admin-analytics";
import { introAiCourse } from "@/lib/curriculum/intro-ai";
import { CLASS_SELECT, rowsToTeacherData, type ClassRow } from "@/lib/db-mapping";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Course } from "@/lib/types";

/**
 * Read API for CIC's own org dashboard: completion and learning gain per
 * cohort, school and program. Protected by a shared secret key.
 *
 *   curl -H "Authorization: Bearer $CIC_DASHBOARD_API_KEY" https://<site>/api/v1/cohorts
 *
 * Optional filters: ?school=<name>  ?code=<class code>
 * Returns aggregates only. Never student names, picture codes or answers.
 * All rates are fractions from 0 to 1. Documented in docs/API.md.
 */

export const dynamic = "force-dynamic";

const COURSES: Record<string, Course> = { [introAiCourse.id]: introAiCourse };
const MIN_KEY_LENGTH = 24;

const sha = (v: string) => createHash("sha256").update(v).digest();

/** Constant-time comparison of the presented key against the configured one. */
function keyMatches(header: string | null, configured: string): boolean {
  const presented = header?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!presented) return false;
  return timingSafeEqual(sha(presented), sha(configured));
}

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

const round = (x: number | null) => (x === null ? null : Math.round(x * 10000) / 10000);

function cohortOut(s: ClassSummary, schoolName: string) {
  return {
    code: s.cls.code,
    name: s.cls.name,
    school: schoolName,
    school_id: s.cls.schoolId ?? null,
    teacher: s.cls.teacherName,
    course_id: s.cls.courseId,
    students: s.students,
    students_started: s.started,
    completion: round(s.completion),
    pretest_avg: round(s.pre),
    posttest_avg: round(s.post),
    learning_gain: round(s.gain),
    students_with_gain: s.gainStudents,
    students_needing_help: s.stuck,
    last_active_at: s.lastActiveAt,
  };
}

function totals(r: ReturnType<typeof rollup>) {
  return {
    cohorts: r.classes,
    students: r.students,
    students_started: r.started,
    completion: round(r.completion),
    pretest_avg: round(r.pre),
    posttest_avg: round(r.post),
    learning_gain: round(r.gain),
    students_with_gain: r.gainStudents,
    students_needing_help: r.stuck,
  };
}

export async function GET(request: Request) {
  // Fail closed: with no usable key configured, nobody gets in (never "undefined === undefined").
  const configured = process.env.CIC_DASHBOARD_API_KEY ?? "";
  if (configured.length < MIN_KEY_LENGTH) return json({ error: "not_configured" }, 503);
  if (!keyMatches(request.headers.get("authorization"), configured)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "WWW-Authenticate": 'Bearer realm="cic-cohorts"', "Cache-Control": "no-store" } });
  }

  const db = supabaseAdmin();
  if (!db) return json({ error: "not_configured" }, 503);

  const [classes, schools] = await Promise.all([
    db.from("classes").select(CLASS_SELECT).order("created_at", { ascending: true }),
    db.from("schools").select("id, name, city"),
  ]);
  if (classes.error || schools.error) return json({ error: "server_error" }, 500);

  const data = rowsToTeacherData(classes.data as unknown as ClassRow[]);
  const schoolById = new Map((schools.data as { id: string; name: string; city: string }[]).map((s) => [s.id, s]));

  const url = new URL(request.url);
  const wantSchool = url.searchParams.get("school")?.trim().toLowerCase();
  const wantCode = url.searchParams.get("code")?.trim().toUpperCase();

  const rows = data.classes
    .map((cls) => {
      const sch = cls.schoolId ? schoolById.get(cls.schoolId) : undefined;
      return {
        schoolId: cls.schoolId ?? null,
        schoolName: sch?.name ?? cls.school,
        city: sch?.city ?? "",
        summary: summarizeClass(cls, data.progress[cls.id] ?? {}, COURSES[cls.courseId]),
      };
    })
    .filter((r) => (!wantSchool || r.schoolName.toLowerCase() === wantSchool) && (!wantCode || r.summary.cls.code === wantCode));

  const bySchool = new Map<string, { id: string | null; name: string; city: string; list: ClassSummary[] }>();
  for (const r of rows) {
    const k = r.schoolId ?? `text:${r.schoolName}`;
    const g = bySchool.get(k) ?? { id: r.schoolId, name: r.schoolName, city: r.city, list: [] };
    g.list.push(r.summary);
    bySchool.set(k, g);
  }

  return json({
    generated_at: new Date().toISOString(),
    definitions: {
      completion: "Average share of assigned activities finished, per student, 0 to 1.",
      learning_gain: "Average of (wrap-up quiz score minus warm-up quiz score) over students who took both, 0 to 1 scale. 0.25 means +25 points.",
    },
    program: totals(rollup(rows.map((r) => r.summary))),
    schools: [...bySchool.values()].map((g) => ({ id: g.id, name: g.name, city: g.city, ...totals(rollup(g.list)) })),
    cohorts: rows.map((r) => cohortOut(r.summary, r.schoolName)),
  });
}

// Reads only. Anything else is refused.
export const POST = () => json({ error: "method_not_allowed" }, 405);
export const PUT = POST;
export const PATCH = POST;
export const DELETE = POST;

