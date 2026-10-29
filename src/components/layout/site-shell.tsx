import { Footer, type FooterPost } from "@/components/layout/footer";
import { Header, type HeaderVariant } from "@/components/layout/header";

// Placeholder until the Blog PR reads the latest posts from Supabase.
const recentPosts: FooterPost[] = [
  {
    title: "Mustang Bullitt 50th Anniversary",
    href: "/mustang-bullitt-50th-anniversary/",
  },
  {
    title: "Meeting an Aussie petrolhead",
    href: "/meeting-an-aussie-petrolhead/",
  },
  {
    title: "Travelling 2000 miles to meet Emma, a 1923 Riley Tourer",
    href: "/travelling-2000-miles-to-meet-emma-a-1923-riley-tourer/",
  },
  {
    title: "The Distinguished Gentleman’s Drive – Malta 2023",
    href: "/the-distinguished-gentlemans-drive-malta-2023/",
  },
];

export function SiteShell({
  headerVariant,
  children,
}: {
  headerVariant: HeaderVariant;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header variant={headerVariant} />
      <main className="flex-1">{children}</main>
      <Footer recentPosts={recentPosts} />
    </>
  );
}
