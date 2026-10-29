import { getSiteSettings } from "@/lib/site-settings";
import { siteNavigation } from "@/lib/navigation";
import { Footer } from "@/components/layout/footer";
import { Header, type HeaderVariant } from "@/components/layout/header";
import { getRecentPosts } from "@/lib/blog";

export async function SiteShell({
  headerVariant,
  children,
}: {
  headerVariant: HeaderVariant;
  children: React.ReactNode;
}) {
  const recentPosts = (await getRecentPosts(4)).map((p) => ({
    title: p.title,
    href: `/${p.slug}/`,
  }));
  const settings = await getSiteSettings();
  return (
    <>
      <Header
        variant={headerVariant}
        navigation={siteNavigation(settings.navigation)}
      />
      <main className="flex-1">{children}</main>
      <Footer recentPosts={recentPosts} />
    </>
  );
}
