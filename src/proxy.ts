import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Refreshes the Supabase session before Server Components read it (they
// cannot write cookies).
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Every proxy run is billed as Vercel Function CPU (roughly 100ms each), so
// it only runs for signed-in visitors: requests carrying the Supabase auth
// cookie (`sb-<ref>-auth-token`, split into `.0`, `.1`... when large).
// Anonymous page loads never reach it; redirects live in next.config.ts and
// `@/lib/redirects`. Matcher values must be literals (read at build time),
// hence the repetition. Both skip static assets and images.
export const config = {
  matcher: [
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
