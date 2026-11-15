/**
 * The three signed-in roles (students don't sign in; they join with a class
 * code). Roles live in public.profiles.role and are only ever set on the
 * server, never from anything a user can edit.
 */
export type Role = "teacher" | "admin" | "reviewer";

export const ROLE_LABELS: Record<Role, string> = {
  teacher: "Teacher",
  admin: "CIC Admin",
  reviewer: "Reviewer",
};

export function asRole(value: unknown): Role {
  return value === "admin" || value === "reviewer" ? value : "teacher";
}

/** Where each role lands after signing in. */
export function homeFor(role: Role): string {
  return role === "admin" ? "/admin" : role === "reviewer" ? "/review" : "/teach";
}

/**
 * Which areas a role may open. Admins can also open the teacher and reviewer
 * areas (to see what their teachers and reviewers see). Reviewers get no
 * student data, and the database enforces that too.
 */
export function canOpen(role: Role, pathname: string): boolean {
  if (pathname.startsWith("/admin")) return role === "admin";
  if (pathname.startsWith("/review")) return role === "reviewer" || role === "admin";
  if (pathname.startsWith("/teach")) return role === "teacher" || role === "admin";
  return true;
}

/** `?next=` may only point into one of the signed-in areas. */
export function safeNextPath(next: string | null | undefined, role: Role): string {
  if (next && /^\/(teach|admin|review)(\/|$)/.test(next) && !next.startsWith("//") && canOpen(role, next)) return next;
  return homeFor(role);
}
