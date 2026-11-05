import { NextResponse, type NextRequest } from "next/server";
import { findRedirect } from "@/lib/redirects";
import { updateSession } from "@/lib/supabase/proxy";

// Supabase stores the session in `sb-<ref>-auth-token`, split into `.0`,
// `.1`... when it is large.
function hasAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));
}

export async function proxy(request: NextRequest) {
  const rule = await findRedirect(request.nextUrl.pathname);
  if (rule) {
    const target = new URL(rule.destination, request.url);
    // Keep the query string unless the rule sets its own.
    if (!target.search) target.search = request.nextUrl.search;
    return NextResponse.redirect(target, rule.permanent ? 301 : 302);
  }
  // Visitors without a session have nothing to refresh.
  if (!hasAuthCookie(request)) return NextResponse.next();
  return updateSession(request);
}

// Every proxy run is billed as Vercel Function CPU, so it only runs when it
// has work to do:
// 1. Full page loads (no `rsc` header): redirects and session refresh. Client
//    navigations and link prefetches send `rsc`; they follow our own links,
//    which point at current URLs, not redirect sources.
// 2. Any request from a signed-in visitor, so the session is refreshed before
//    Server Components read it (they cannot write cookies).
// Matcher values must be literals (read at build time), hence the repetition.
// All three skip static assets and images.
export const config = {
  matcher: [
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|mp4|ico)$).*)",
      missing: [
        { type: "header", key: "rsc" },
        { type: "header", key: "next-router-prefetch" },
      ],
    },
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|mp4|ico)$).*)",
      has: [{ type: "cookie", key: "sb-wdctbixfjvwbvqlylpuf-auth-token" }],
    },
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|mp4|ico)$).*)",
      has: [{ type: "cookie", key: "sb-wdctbixfjvwbvqlylpuf-auth-token.0" }],
    },
  ],
};
