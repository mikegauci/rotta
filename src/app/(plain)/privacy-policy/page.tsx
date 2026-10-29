import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { getStaticPage } from "@/lib/static-pages";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getStaticPage("privacy-policy");
  const seo = page?.seo as
    | {
        title?: string;
        description?: string;
        noindex?: boolean;
        canonical?: string;
      }
    | undefined;
  return {
    title: seo?.title || page?.title || "Privacy Policy",
    description: seo?.description || undefined,
    robots: seo?.noindex ? { index: false } : undefined,
    alternates: seo?.canonical ? { canonical: seo.canonical } : undefined,
  };
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
    <Container className="py-16">
      <h1 className="text-ink mb-8 text-[40px] leading-[1.3] font-black">
        {page.title}
      </h1>
      <div
        className="post-content privacy-content"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </Container>
  );
}
