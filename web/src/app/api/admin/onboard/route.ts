import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/supabase/server";

/**
 * CIC admins add a partner school and/or a teacher account without an
 * engineer. The caller's role is checked server-side; accounts are created
 * with the service key and always get role "teacher". A random temporary
 * password is returned once, for the admin to pass on.
 */

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const text = (v: unknown, max: number): string | null =>
  typeof v === "string" && v.trim().length <= max ? v.trim().replace(/[<>]/g, "") : null;

const fail = (message: string, status = 400) => NextResponse.json({ error: "invalid", message }, { status });

export async function POST(request: Request) {
  const auth = await requireRole(["admin"]);
  if ("error" in auth) return auth.error;
  const { db, user } = auth;

  const body = (await request.json().catch(() => null)) as Record<string, any> | null; // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!body || typeof body !== "object") return fail("Bad request.");

  // ---- which school? an existing one, or a new one ----
  let schoolId: string | null = null;
  let createdSchool = false;
  if (body.schoolId !== undefined) {
    if (typeof body.schoolId !== "string" || !UUID.test(body.schoolId)) return fail("Pick a school from the list.");
    const found = await db.from("schools").select("id").eq("id", body.schoolId).maybeSingle();
    if (!found.data) return fail("That school doesn't exist.", 404);
    schoolId = found.data.id;
  } else {
    const name = text(body.school?.name, 80);
    const city = text(body.school?.city ?? "", 80);
    const contactName = text(body.school?.contactName ?? "", 80);
    const contactEmail = text(body.school?.contactEmail ?? "", 120);
    if (!name) return fail("Enter the school's name (up to 80 characters).");
    if (city === null || contactName === null || contactEmail === null) return fail("One of the school fields is too long.");
    if (contactEmail && !EMAIL.test(contactEmail)) return fail("The school contact email doesn't look right.");
    const ins = await db
      .from("schools")
      .insert({ name, city, contact_name: contactName, contact_email: contactEmail, created_by: user.id })
      .select("id")
      .single();
    if (ins.error) {
      return ins.error.code === "23505" ? fail("A school with that name already exists.", 409) : fail("Couldn't save the school.", 500);
    }
    schoolId = ins.data.id;
    createdSchool = true;
  }

  // ---- optional teacher account ----
  if (body.teacher === undefined || body.teacher === null) return NextResponse.json({ schoolId });

  const tName = text(body.teacher.name, 80);
  const tEmail = text(body.teacher.email, 120)?.toLowerCase() ?? null;
  const undoSchool = async () => {
    if (createdSchool && schoolId) await db.from("schools").delete().eq("id", schoolId);
  };
  if (!tName) {
    await undoSchool();
    return fail("Enter the teacher's name.");
  }
  if (!tEmail || !EMAIL.test(tEmail)) {
    await undoSchool();
    return fail("Enter a valid teacher email.");
  }

  const tempPassword = randomBytes(10).toString("base64url");
  const created = await db.auth.admin.createUser({ email: tEmail, password: tempPassword, email_confirm: true });
  if (created.error || !created.data.user) {
    await undoSchool();
    const exists = /already|registered|exists/i.test(created.error?.message ?? "");
    return fail(exists ? "An account with that email already exists." : "Couldn't create the teacher account.", exists ? 409 : 500);
  }

  // The role is set here, on the server. Never from anything the user can edit.
  const prof = await db
    .from("profiles")
    .update({ role: "teacher", display_name: tName, school_id: schoolId, email: tEmail })
    .eq("id", created.data.user.id);
  if (prof.error) {
    await db.auth.admin.deleteUser(created.data.user.id);
    await undoSchool();
    return fail("Couldn't finish setting up the teacher.", 500);
  }

  return NextResponse.json({ schoolId, teacher: { email: tEmail, tempPassword } });
}
