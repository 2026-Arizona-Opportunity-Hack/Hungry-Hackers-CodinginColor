import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Student step 1: look up a class by its join code.
 * Returns the class and roster *names only*: picture codes never leave the
 * server, they're checked in /api/join/student.
 */
export async function POST(request: Request) {
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code.replace(/[^a-z0-9]/gi, "").toUpperCase() : "";
  if (!/^[A-Z0-9]{6}$/.test(code)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data, error } = await db
    .from("classes")
    .select("id, name, school, roster_students(id, first_name, last_initial, created_at)")
    .eq("code", code)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "server_error" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const roster = [...(data.roster_students as { id: string; first_name: string; last_initial: string; created_at: string }[])]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((s) => ({ id: s.id, firstName: s.first_name, lastInitial: s.last_initial }));

  return NextResponse.json({ id: data.id, name: data.name, school: data.school, roster });
}
