import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, rolesForPath } from "@/lib/auth-areas";
import { asRole, canOpen, homeFor, type Role } from "@/lib/roles";

/**
 * Keeps each role's Supabase session fresh and guards /teach, /admin and /review.
 * Teachers, CIC admins and reviewers each have their own login cookie, so all three
 * can be signed in at once in one browser. (Students never sign in; they join with a
 * class code.) This is the friendly layer; row-level security and the API routes do
 * the real enforcing.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  // Every refreshed login cookie, from any role, so none is lost when the response is rebuilt.
  const refreshed: { name: string; value: string; options: Parameters<typeof response.cookies.set>[2] }[] = [];

  const finish = (res: NextResponse) => {
    refreshed.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  };

  const clientFor = (role: Role) =>
    createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookieOptions: { name: COOKIE_NAME[role] },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            refreshed.push({ name, value, options });
          });
          response = finish(NextResponse.next({ request }));
        },
      },
    });

  /** The signed-in person for the first of `roles` that has a valid login, with their database role. */
  async function whoFor(roles: Role[]) {
    for (const r of roles) {
      const supabase = clientFor(r);
      // getUser() re-validates the token with Supabase; getSession() would only read the cookie.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) continue;
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      return { role: asRole(profile?.role) };
    }
    return null;
  }

  const { pathname, searchParams } = request.nextUrl;
  const redirect = (to: string, next?: string) => {
    const url = request.nextUrl.clone();
    url.pathname = to;
    url.search = "";
    if (next) url.searchParams.set("next", next);
    return finish(NextResponse.redirect(url));
  };

  if (pathname === "/login") {
    // Already signed in for the area you're heading to? Skip the form. Otherwise show it
    // (being signed in as another role is fine: that login stays untouched).
    const next = searchParams.get("next");
    const roles = next ? rolesForPath(next) : null;
    const who = roles ? await whoFor(roles) : null;
    if (next && who && canOpen(who.role, next)) {
      const url = request.nextUrl.clone();
      url.pathname = next;
      url.search = "";
      return finish(NextResponse.redirect(url));
    }
    return response;
  }

  const roles = rolesForPath(pathname);
  if (!roles) return response;
  const who = await whoFor(roles);
  if (!who) return redirect("/login", pathname);
  if (!canOpen(who.role, pathname)) return redirect(homeFor(who.role));
  return response;
}

export const config = {
  matcher: ["/teach/:path*", "/admin/:path*", "/review/:path*", "/login"],
};
