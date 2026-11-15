import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth-areas";
import { asRole, type Role } from "@/lib/roles";
import { supabaseAdmin } from "./admin";

/** Supabase client acting as the signed-in person for one role (reads that role's login cookie). */
export async function supabaseServer(role: Role) {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: { name: COOKIE_NAME[role] },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* called from a read-only context; the middleware refreshes the session */
        }
      },
    },
  });
}

/**
 * For API routes: who is calling and what is their role? Tries the login cookie of
 * each allowed role in turn, then reads the role from the database with the service
 * key. Nothing from the request body or the browser is trusted. Returns a
 * ready-made error response otherwise.
 */
export async function requireRole(allowed: Role[]) {
  const db = supabaseAdmin();
  if (!db) return { error: NextResponse.json({ error: "not_configured" }, { status: 503 }) };

  let sawUser = false;
  for (const candidate of allowed) {
    const {
      data: { user },
    } = await (await supabaseServer(candidate)).auth.getUser();
    if (!user) continue;
    sawUser = true;
    const profile = await db.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const role = asRole(profile.data?.role);
    if (allowed.includes(role)) return { db, user, role };
  }
  return { error: NextResponse.json({ error: sawUser ? "forbidden" : "signed_out" }, { status: sawUser ? 403 : 401 }) };
}
