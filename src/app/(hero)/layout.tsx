import { SiteShell } from "@/components/layout/site-shell";

// Pages with a full-width hero under a transparent header.
export default function HeroLayout({ children }: LayoutProps<"/">) {
  return <SiteShell headerVariant="transparent">{children}</SiteShell>;
}
