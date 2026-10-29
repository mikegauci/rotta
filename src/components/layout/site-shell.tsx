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
  return (
    <>
      <Header variant={headerVariant} />
      <main className="flex-1">{children}</main>
      <Footer recentPosts={recentPosts} />
    </>
  );
}
