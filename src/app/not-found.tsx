import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { NotFoundContent } from "@/components/not-found-content";

export const metadata: Metadata = {
  title: { absolute: "Page not found - Rotta" },
  robots: { index: false },
};

// Unknown URLs that match no route (notFound() in (plain) pages uses
// (plain)/not-found.tsx, so the shell isn't rendered twice).
export default function NotFound() {
  return (
    <SiteShell headerVariant="solid">
      <NotFoundContent />
    </SiteShell>
  );
}
