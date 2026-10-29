import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { codePageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/page-hero";
import { getPageImage, getStaticPage } from "@/lib/static-pages";

export function generateMetadata() {
  return codePageMetadata("privacy-policy", "Privacy Policy");
}

export default async function PrivacyPolicy() {
  const page = await getStaticPage("privacy-policy");
  if (!page) notFound();
  // The imported Termly document contains flat CSS rules for ul/ol. Keep its
  // typography while preventing those rules from styling navigation/footer lists.
  const content = page.content.replace(
    /<style([^>]*)>([\s\S]*?)<\/style>/gi,
    (_tag, attributes: string, css: string) =>
      `<style${attributes}>${css.replace(
        /(^|})\s*([^{}]+)\{/g,
        (_rule, boundary: string, selectors: string) =>
          `${boundary} ${selectors
            .split(",")
            .map((selector) => `.privacy-content ${selector.trim()}`)
            .join(", ")} {`,
      )}</style>`,
  );
  return (
    <>
      {page.hero_media_id && (
        <PageHero
          image={await getPageImage(page.hero_media_id)}
          title={page.title}
        />
      )}
      <Container className="py-16">
        {/* The imported policy starts with its own "PRIVACY NOTICE" heading. */}
        {!page.hero_media_id && <h1 className="sr-only">{page.title}</h1>}
        <div
          className="post-content privacy-content"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </Container>
    </>
  );
}
