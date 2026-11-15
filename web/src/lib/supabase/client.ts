"use client";

import { createBrowserClient } from "@supabase/ssr";
import { COOKIE_NAME, rolesForPath } from "@/lib/auth-areas";
import type { Role } from "@/lib/roles";

/**
 * Browser Supabase client for a signed-in teacher, admin or reviewer. It uses the
 * publishable (anon) key, so row-level security decides what they can read.
 * Students never use this: they go through the server routes.
 *
 * One client per role, each with its own login cookie, so being signed in as a
 * teacher and a CIC admin in the same browser never mixes them up. The library
 * caches a single client by default, which would silently share one session
 * between roles, so that is switched off and the clients are kept here.
 */
const clients = new Map<Role, ReturnType<typeof createBrowserClient>>();

export function supabaseBrowserFor(role: Role) {
  let client = clients.get(role);
  if (!client) {
    client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      isSingleton: false,
      cookieOptions: { name: COOKIE_NAME[role] },
    });
    clients.set(role, client);
  }
  return client;
}

const hasCookie = (name: string) => document.cookie.split("; ").some((c) => c.startsWith(`${name}=`) || c.startsWith(`${name}.0=`));

/** The client for whichever area the current page is in (/teach, /admin or /review). */
export function supabaseBrowser() {
  const roles = rolesForPath(window.location.pathname);
  if (!roles) throw new Error(`No signed-in area for ${window.location.pathname}; use supabaseBrowserFor(role).`);
  return supabaseBrowserFor(roles.find((r) => hasCookie(COOKIE_NAME[r])) ?? roles[0]);
}
