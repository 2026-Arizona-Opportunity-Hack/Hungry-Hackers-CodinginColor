import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Self-learner sign-up: someone learning on their own makes an account.
 * The account is created here with the service key, always with role "learner"
 * (the lowest role: no teaching, reviewing or admin), and it ONLY ever creates a
 * brand-new account. An email that already exists is refused, so signing up can
 * never change an existing teacher's or admin's account.
 *
 * NOTE: emails are not verified (email_confirm is set), and the rate limit below
 * lives in this server's memory, so it resets on each deploy and is per server.
 */

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
const MAX_PER_HOUR = 5;
const hits = new Map<string, { count: number; reset: number }>();

function limited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || h.reset < now) {
    hits.set(ip, { count: 1, reset: now + 3_600_000 });
    return false;
  }
  h.count += 1;
  return h.count > MAX_PER_HOUR;
}

const fail = (message: string, status = 400) => NextResponse.json({ error: "invalid", message }, { status });

export async function POST(request: Request) {
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  if (limited(ip)) return fail("Too many sign-ups from this connection. Please try again in an hour.", 429);

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
