import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Self-learner sign-up: someone learning on their own makes an account.
 * The account is created here with the service key, always with role "learner"
 * (the lowest role: no teaching, reviewing or admin), and it ONLY ever creates a
 * brand-new account. An email that already exists is refused, so signing up can
 * never change an existing teacher's or admin's account.
 *
 * NOTE: emails are not verified (email_confirm is set). Sign-ups are rate limited
 * through the signup_attempts table (shared by every server instance): a few per
 * connection per hour, and a cap on the whole site so a spread-out script can't
 * flood the database either.
 */

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
const MAX_PER_CLIENT_PER_HOUR = 5;
const MAX_TOTAL_PER_HOUR = 100;
const MAX_BODY_BYTES = 2_000;

function clientKey(request: Request): string {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  return createHash("sha256").update(`signup:${ip}`).digest("hex");
}

const fail = (message: string, status = 400) => NextResponse.json({ error: "invalid", message }, { status });

export async function POST(request: Request) {
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  // Cheap checks first, before touching the database.
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return fail("That request is too large.", 413);

  const client = clientKey(request);
  const since = new Date(Date.now() - 3_600_000).toISOString();
  const [mine, all] = await Promise.all([
    db.from("signup_attempts").select("id", { count: "exact", head: true }).eq("client_key", client).gte("created_at", since),
    db.from("signup_attempts").select("id", { count: "exact", head: true }).gte("created_at", since),
  ]);
  // If we can't check the limit, don't allow the sign-up.
  if (mine.error || all.error) return NextResponse.json({ error: "unavailable", message: "Sign-up is unavailable right now. Please try again soon." }, { status: 503 });
  if ((mine.count ?? 0) >= MAX_PER_CLIENT_PER_HOUR) return fail("Too many sign-ups from this connection. Please try again in an hour.", 429);
  if ((all.count ?? 0) >= MAX_TOTAL_PER_HOUR) return fail("Lots of people are signing up right now. Please try again in a little while.", 429);
  // Every attempt counts, successful or not. Old rows are swept so the table stays small.
  await db.from("signup_attempts").insert({ client_key: client });
  void db.from("signup_attempts").delete().lt("created_at", new Date(Date.now() - 86_400_000).toISOString());

  const body = (await request.json().catch(() => null)) as { name?: unknown; email?: unknown; password?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name.replace(/[<>]/g, "").trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (name.length < 1 || name.length > 80) return fail("Enter your name (up to 80 characters).");
  if (!EMAIL.test(email) || email.length > 120) return fail("Enter a valid email address.");
  if (password.length < 8 || password.length > 72) return fail("Choose a password between 8 and 72 characters.");

  const created = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error || !created.data.user) {
    // Same message whether the email is taken or something else failed: no hints about who has an account.
    return fail("We couldn't create that account. If you already have one, sign in instead.", 409);
  }

  // The role is set here on the server. If this fails, remove the account rather than leave one half-made.
  const prof = await db.from("profiles").update({ role: "learner", display_name: name, email }).eq("id", created.data.user.id);
  if (prof.error) {
    await db.auth.admin.deleteUser(created.data.user.id);
    return fail("Couldn't finish setting up your account. Please try again.", 500);
  }
  return NextResponse.json({ ok: true });
}
