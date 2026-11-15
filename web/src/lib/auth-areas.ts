import type { Role } from "./roles";

/**
 * Each signed-in role keeps its OWN login cookie, so a teacher, a CIC admin and a
 * reviewer can all be signed in at the same time in one browser without replacing
 * each other. This file is the single place that says which cookie a page or API
 * route uses; the browser client, the server client and the middleware all import it.
 */

export const COOKIE_NAME: Record<Role, string> = {
  teacher: "cic-auth-teacher",
  admin: "cic-auth-admin",
  reviewer: "cic-auth-reviewer",
};

/**
 * Which role logins a path may use, in the order to try them. `null` means the
 * path has no signed-in area (home, join, the public catalog, the login page).
 */
export function rolesForPath(path: string): Role[] | null {
  if (path.startsWith("/admin") || path.startsWith("/api/admin")) return ["admin"];
  if (path.startsWith("/teach")) return ["teacher"];
  // Admins may look at the reviewer view; a reviewer login wins if both exist.
  if (path.startsWith("/review")) return ["reviewer", "admin"];
  return null;
}
