import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Course } from "@/lib/types";
import { introAiCourse } from "./intro-ai";

/**
 * Server-side access to the course content. The course that ships in code is the
 * starting point and the fallback; once CIC staff publish edits, the published
 * copy in Supabase is what everyone sees. Server only.
 */

export const CODE_COURSES: Record<string, Course> = { [introAiCourse.id]: introAiCourse };

type Status = "draft" | "published";
interface Row {
  content: Course;
  version: number;
  updated_at: string;
}

export async function readRow(db: SupabaseClient, courseId: string, status: Status): Promise<Row | null> {
  const { data } = await db.from("curriculum_courses").select("content, version, updated_at").eq("course_id", courseId).eq("status", status).maybeSingle();
  return (data as Row | null) ?? null;
}

/** Creates the draft and published rows from the code course the first time they're needed. */
export async function ensureSeeded(db: SupabaseClient, courseId: string): Promise<void> {
  const base = CODE_COURSES[courseId];
  if (!base) return;
  await db
    .from("curriculum_courses")
    .upsert(
      [
        { course_id: courseId, status: "draft", content: base },
        { course_id: courseId, status: "published", content: base },
      ],
      { onConflict: "course_id,status", ignoreDuplicates: true },
    );
}

/** The course students see: the published copy, or the code version if there isn't one (or the database is down). */
export async function getPublishedCourse(courseId: string): Promise<Course | undefined> {
  const db = supabaseAdmin();
  if (db) {
    try {
      const row = await readRow(db, courseId, "published");
      if (row?.content?.modules?.length) return row.content;
    } catch {
      /* fall back to the code course */
    }
  }
  return CODE_COURSES[courseId];
}

export async function getPublishedCourses(): Promise<Course[]> {
  const all = await Promise.all(Object.keys(CODE_COURSES).map(getPublishedCourse));
  return all.filter((c): c is Course => Boolean(c));
}
