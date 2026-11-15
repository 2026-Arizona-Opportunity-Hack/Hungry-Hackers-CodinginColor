import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { asRole, canOpen, homeFor } from "@/lib/roles";

/**
 * Keeps the teacher's Supabase session fresh and sends signed-out visitors
 * from /teach, /admin and /review to /login, then keeps each role in its own
 * area. (Students never sign in; they join with a class code.)
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() re-validates the token with Supabase; getSession() would only read the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const redirect = (to: string, next?: string, wrongRole?: string) => {
    const url = request.nextUrl.clone();
    url.pathname = to;
    url.search = "";
    if (next) url.searchParams.set("next", next);
    if (wrongRole) url.searchParams.set("wrong", wrongRole);
    return NextResponse.redirect(url);
  };

  if (!user) {
    return pathname === "/login" ? response : redirect("/login", pathname);
  }

  // Signed in: send people to their own area. (This is the friendly layer; the
  // database's row-level security and the API routes do the real enforcing.)
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const role = asRole(profile?.role);
  // `?wrong=` means "you're signed in as the wrong role for that page": show the sign-in
  // page with an explanation instead of silently dropping you into another role's area.
  if (pathname === "/login") return request.nextUrl.searchParams.has("wrong") ? response : redirect(homeFor(role));
  if (!canOpen(role, pathname)) return redirect("/login", pathname, role);
  return response;
}

export const config = {
  matcher: ["/teach/:path*", "/admin/:path*", "/review/:path*", "/login"],
};
