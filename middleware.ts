import { NextResponse, type NextRequest } from "next/server";

// Single shared passphrase gate for Roger + Sarah. The cookie holds a token that
// must equal AGENCY_ZERO_PASSPHRASE. If no passphrase is configured (local dev),
// the gate is a no-op so `npm run dev` just works.

const COOKIE = "az_auth";

export function middleware(req: NextRequest) {
  const pass = process.env.AGENCY_ZERO_PASSPHRASE;
  const { pathname } = req.nextUrl;

  // Always allow the login route + Next internals + static assets.
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  if (!pass) return NextResponse.next(); // unconfigured => open (dev)

  const token = req.cookies.get(COOKIE)?.value;
  if (token === pass) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
