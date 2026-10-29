import { SiteShell } from "@/components/layout/site-shell";

// Pages with a solid white header (events, shop, posts, legal pages).
export default function PlainLayout({ children }: LayoutProps<"/">) {
  return <SiteShell headerVariant="solid">{children}</SiteShell>;
}
