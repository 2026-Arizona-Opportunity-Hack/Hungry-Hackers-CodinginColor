import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Keeps the teacher's Supabase session fresh and sends signed-out visitors
 * from /teach/* to /login. (Students never touch /teach.)
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
  if (!user && pathname.startsWith("/teach")) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  if (user && pathname === "/login") {
    const dest = request.nextUrl.clone();
    dest.pathname = "/teach";
    dest.search = "";
    return NextResponse.redirect(dest);
  }
  return response;
}

export const config = {
  matcher: ["/teach/:path*", "/login"],
};
