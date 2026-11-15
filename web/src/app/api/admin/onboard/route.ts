import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/supabase/server";

/**
 * CIC admins add a partner school and/or a teacher or reviewer account without
 * an engineer. The caller's role is checked server-side; accounts are created
 * with the service key. The new account's role comes from a fixed allowlist
 * (teacher or reviewer), so this route can never create an admin. A random
 * temporary password is returned once, for the admin to pass on.
 */
const ALLOWED_ROLES = ["teacher", "reviewer"] as const;
type NewRole = (typeof ALLOWED_ROLES)[number];

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
  // A reviewer account needs no school; everything else does.
  const wantsSchool = body.schoolId !== undefined || body.school !== undefined;
  if (!wantsSchool && body.account?.role !== "reviewer") return fail("Pick a school or enter a new one.");
  if (!wantsSchool) {
    /* reviewer only */
  } else if (body.schoolId !== undefined) {
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

  // ---- optional login (teacher or reviewer) ----
  const account = body.account ?? (body.teacher ? { ...body.teacher, role: "teacher" } : null);
  if (!account) return NextResponse.json({ schoolId });
  const role: NewRole = ALLOWED_ROLES.includes(account.role) ? account.role : "teacher";

  const tName = text(account.name, 80);
  const tEmail = text(account.email, 120)?.toLowerCase() ?? null;
  const undoSchool = async () => {
    if (createdSchool && schoolId) await db.from("schools").delete().eq("id", schoolId);
  };
  if (!tName) {
    await undoSchool();
    return fail("Enter the person's name.");
  }
  if (!tEmail || !EMAIL.test(tEmail)) {
    await undoSchool();
    return fail("Enter a valid email.");
  }

  const tempPassword = randomBytes(10).toString("base64url");
  const created = await db.auth.admin.createUser({ email: tEmail, password: tempPassword, email_confirm: true });
  const accountId = created.data.user?.id ?? null;
  if (created.error || !accountId) {
    const exists = /already|registered|exists/i.test(created.error?.message ?? "");
    if (!exists) {
      await undoSchool();
      return fail("Couldn't create the account.", 500);
    }
    // The email already has an account. Never touch an admin's or a self-learner's account.
    // An existing teacher/reviewer can be given a fresh temporary password and (for
    // teachers) moved to this school, but only when the admin explicitly confirms
    // (body.resetExisting), so it can't happen by accident.
    const existing = await db.from("profiles").select("id, role").ilike("email", tEmail).maybeSingle();
    const ex = existing.data as { id: string; role: string } | null;
    await undoSchool();
    if (!ex) return fail("An account with that email already exists, but it isn't a teacher or reviewer account. Use a different email.", 409);
    if (ex.role === "admin") return fail("That email belongs to a CIC admin account, which can't be changed here.", 409);
    if (ex.role !== role) {
      return fail(
        ex.role === "learner"
          ? "That email is already a self-learner account. Use a different email for the teacher."
          : `That email is already a ${ex.role} account, so it can't also be a ${role}. Use a different email.`,
        409,
      );
    }
    if (body.resetExisting !== true) {
      return NextResponse.json(
        { error: "exists", message: `${tEmail} already has a ${role} account. Reset its password and add it to this school?` },
        { status: 409 },
      );
    }
    // Confirmed: re-create the school if we had just rolled it back, then reset the password.
    if (createdSchool) {
      const again = await db.from("schools").insert(body.school ? { name: text(body.school.name, 80), city: text(body.school.city ?? "", 80), contact_name: text(body.school.contactName ?? "", 80), contact_email: text(body.school.contactEmail ?? "", 120), created_by: user.id } : {}).select("id").single();
      if (again.error) return fail("Couldn't save the school.", 500);
      schoolId = again.data.id;
    }
    const upd = await db.auth.admin.updateUserById(ex.id, { password: tempPassword, email_confirm: true });
    if (upd.error) return fail("Couldn't reset that account's password.", 500);
    const prof2 = await db.from("profiles").update({ display_name: tName, ...(role === "teacher" ? { school_id: schoolId } : {}) }).eq("id", ex.id);
    if (prof2.error) return fail("Couldn't update the account.", 500);
    return NextResponse.json({ schoolId, reset: true, account: { role, email: tEmail, tempPassword }, teacher: { email: tEmail, tempPassword } });
  }

  // The role is set here, on the server. Never from anything the user can edit.
  const prof = await db
    .from("profiles")
    .update({ role, display_name: tName, school_id: schoolId, email: tEmail })
    .eq("id", created.data.user.id);
  if (prof.error) {
    await db.auth.admin.deleteUser(created.data.user.id);
    await undoSchool();
    return fail("Couldn't finish setting up the account.", 500);
  }

  return NextResponse.json({ schoolId, account: { role, email: tEmail, tempPassword }, teacher: { email: tEmail, tempPassword } });
}
