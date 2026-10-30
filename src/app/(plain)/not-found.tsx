import type { Metadata } from "next";
import { NotFoundContent } from "@/components/not-found-content";

export const metadata: Metadata = {
  title: { absolute: "Page not found - Rotta" },
  robots: { index: false },
};

// notFound() in a (plain) page: the group layout already renders SiteShell.
export default function NotFound() {
  return <NotFoundContent />;
}
