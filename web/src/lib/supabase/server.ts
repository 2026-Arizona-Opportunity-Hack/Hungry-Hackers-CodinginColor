import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { asRole, type Role } from "@/lib/roles";
import { DEMO_ADMIN_EMAIL } from "@/lib/demo-accounts";
import { supabaseAdmin } from "./admin";

/** Supabase client acting as whoever is signed in (reads the session cookie). */
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
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
 * For API routes: who is calling and what is their role? The role is read
 * from the database with the service key. Nothing from the request body or
 * the browser is trusted. Returns a ready-made error response otherwise.
 */
export async function requireRole(allowed: Role[]) {
  const db = supabaseAdmin();
  if (!db) return { error: NextResponse.json({ error: "not_configured" }, { status: 503 }) };

  const {
    data: { user },
  } = await (await supabaseServer()).auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "signed_out" }, { status: 401 }) };

  const profile = await db.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const role = asRole(profile.data?.role);
  if (!allowed.includes(role)) return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  // The public trial admin may look but not change live data or add accounts.
  const demo = user.email?.toLowerCase() === DEMO_ADMIN_EMAIL;
  return { db, user, role, demo };
}
