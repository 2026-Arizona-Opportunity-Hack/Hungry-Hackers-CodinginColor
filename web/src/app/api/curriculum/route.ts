import { NextResponse } from "next/server";
import { getPublishedCourses } from "@/lib/curriculum/server";

/**
 * The published course(s), for the student, teacher and reviewer screens.
 * Public on purpose: the content (including answer keys) already ships to every
 * browser. Edits are admin-only and go through /api/admin/curriculum.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const courses = await getPublishedCourses();
  return NextResponse.json({ courses }, { headers: { "Cache-Control": "no-store" } });
}
