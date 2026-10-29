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
  return (
    <Container className="py-16">
      <h1 className="text-ink mb-8 text-[40px] leading-[1.3] font-black">
        {page.title}
      </h1>
      <div
        className="post-content"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </Container>
  );
}
