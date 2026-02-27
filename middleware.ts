import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hasStaleServerActionHeader =
    request.method === "POST" && request.headers.has("next-action");

  // This app does not use Next Server Actions. If a client sends a stale
  // next-action request (usually from old browser state/cache), convert it to
  // a normal GET navigation to recover without runtime errors.
  if (hasStaleServerActionHeader && process.env.ALLOW_SERVER_ACTIONS !== "1") {
    const url = request.nextUrl.clone();
    return NextResponse.redirect(url, 303);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip API routes and static assets (files containing a dot) so Next can
    // serve public files like /manifest.json and /images/* directly.
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"
  ]
};
