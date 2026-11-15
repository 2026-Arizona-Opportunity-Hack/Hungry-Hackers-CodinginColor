import { NextResponse } from "next/server";
import { CODE_COURSES, ensureSeeded, readRow } from "@/lib/curriculum/server";
import { canon, validateCourse } from "@/lib/curriculum/validate";
import { requireRole } from "@/lib/supabase/server";
import type { Course } from "@/lib/types";

/**
 * CIC admins edit and publish the curriculum without a developer.
 *   GET   -> draft + published + whether the draft has unpublished changes
 *   PUT   -> save the draft  { courseId, content }
 *   POST  -> { courseId, action: "publish", assignNew? } or { courseId, action: "discard" }
 * Every write is validated here; there is no direct write path to the table.
 */

export const dynamic = "force-dynamic";

const fail = (message: string, status = 400, extra: object = {}) => NextResponse.json({ error: "invalid", message, ...extra }, { status });
const sameModules = (a: Course, b: Course) => canon(a.modules) === canon(b.modules);

function courseIdOf(v: unknown): string | null {
  return typeof v === "string" && CODE_COURSES[v] ? v : null;
}

async function load(db: NonNullable<Awaited<ReturnType<typeof requireRole>>["db"]>, courseId: string) {
  await ensureSeeded(db, courseId);
  const [draft, published] = await Promise.all([readRow(db, courseId, "draft"), readRow(db, courseId, "published")]);
  return { draft, published };
}

export async function GET(request: Request) {
  const auth = await requireRole(["admin"]);
  if ("error" in auth) return auth.error;
  const courseId = courseIdOf(new URL(request.url).searchParams.get("courseId") ?? Object.keys(CODE_COURSES)[0]);
  if (!courseId) return fail("Unknown course.", 404);
  const { draft, published } = await load(auth.db, courseId);
  if (!draft || !published) return fail("Couldn't load the curriculum.", 500);
  const check = validateCourse(draft.content, published.content, [CODE_COURSES[courseId], draft.content, published.content]);
  return NextResponse.json({
    courseId,
    draft: draft.content,
    published: published.content,
    draftVersion: draft.version,
    publishedVersion: published.version,
    publishedAt: published.updated_at,
    dirty: !sameModules(draft.content, published.content),
    publishErrors: [...check.errors, ...check.publishErrors],
  });
}

export async function PUT(request: Request) {
  const auth = await requireRole(["admin"]);
  if ("error" in auth) return auth.error;
  const body = (await request.json().catch(() => null)) as { courseId?: unknown; content?: unknown } | null;
  const courseId = courseIdOf(body?.courseId);
  if (!courseId) return fail("Unknown course.", 404);

  const { draft, published } = await load(auth.db, courseId);
  if (!draft || !published) return fail("Couldn't load the curriculum.", 500);
  const result = validateCourse(body?.content, published.content, [CODE_COURSES[courseId], draft.content, published.content]);
  if (result.errors.length) return fail("Fix these problems and save again.", 400, { errors: result.errors });

  const saved = await auth.db
    .from("curriculum_courses")
    .update({ content: result.course, version: draft.version + 1, updated_at: new Date().toISOString(), updated_by: auth.user.id })
    .eq("course_id", courseId)
    .eq("status", "draft");
  if (saved.error) return fail("Couldn't save the draft.", 500);
  return NextResponse.json({ ok: true, draftVersion: draft.version + 1, dirty: !sameModules(result.course, published.content), publishErrors: result.publishErrors });
}

export async function POST(request: Request) {
  const auth = await requireRole(["admin"]);
  if ("error" in auth) return auth.error;
  const body = (await request.json().catch(() => null)) as { courseId?: unknown; action?: unknown; assignNew?: unknown } | null;
  const courseId = courseIdOf(body?.courseId);
  if (!courseId) return fail("Unknown course.", 404);

  const { draft, published } = await load(auth.db, courseId);
  if (!draft || !published) return fail("Couldn't load the curriculum.", 500);
  const now = new Date().toISOString();

  if (body?.action === "discard") {
    const r = await auth.db
      .from("curriculum_courses")
      .update({ content: published.content, version: draft.version + 1, updated_at: now, updated_by: auth.user.id })
      .eq("course_id", courseId)
      .eq("status", "draft");
    return r.error ? fail("Couldn't discard the changes.", 500) : NextResponse.json({ ok: true });
  }

  if (body?.action !== "publish") return fail("Unknown action.");
  if (auth.demo) return fail("The demo admin can edit drafts but can't publish. Sign in with your own admin login to publish.", 403);

  const result = validateCourse(draft.content, published.content, [CODE_COURSES[courseId], draft.content, published.content]);
  const problems = [...result.errors, ...result.publishErrors];
  if (problems.length) return fail("Finish these before publishing.", 400, { errors: problems });

  const before = new Set(published.content.modules.map((m) => m.id));
  const newModuleIds = result.course.modules.map((m) => m.id).filter((id) => !before.has(id));

  const pub = await auth.db
    .from("curriculum_courses")
    .update({ content: result.course, version: published.version + 1, updated_at: now, updated_by: auth.user.id })
    .eq("course_id", courseId)
    .eq("status", "published");
  if (pub.error) return fail("Couldn't publish.", 500);

  // Optionally add brand-new modules to classes that already exist (new classes pick them up in the wizard).
  let classesUpdated = 0;
  if (body.assignNew === true && newModuleIds.length) {
    const classes = await auth.db.from("classes").select("id, assigned_module_ids").eq("course_id", courseId);
    const order = result.course.modules.map((m) => m.id);
    for (const c of (classes.data ?? []) as { id: string; assigned_module_ids: string[] }[]) {
      const merged = order.filter((id) => c.assigned_module_ids.includes(id) || newModuleIds.includes(id));
      const u = await auth.db.from("classes").update({ assigned_module_ids: merged }).eq("id", c.id);
      if (!u.error) classesUpdated++;
    }
  }
  return NextResponse.json({ ok: true, publishedVersion: published.version + 1, newModules: newModuleIds.length, classesUpdated });
}
