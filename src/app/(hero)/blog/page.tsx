import { getPageFields } from "@/lib/static-pages";
import { ManagedPageContent } from "@/components/managed-page-content";
import { PostGrid } from "@/components/blog/post-card";
import { Container } from "@/components/layout/container";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { PageHero } from "@/components/page-hero";
import { getPageHero, getPostSummaries } from "@/lib/blog";
import { codePageMetadata } from "@/lib/seo";

export function generateMetadata() {
  return codePageMetadata("blog", "Blog");
}

export default async function BlogPage() {
  const fields = await getPageFields("blog");
  const [hero, posts] = await Promise.all([
    getPageHero("blog"),
    getPostSummaries(),
  ]);
  return (
    <>
      <ManagedPageContent path="blog">
        <PageHero
          image={hero}
          title={<span className="whitespace-pre-line">{fields.heading}</span>}
          subtitle={
            <span className="whitespace-pre-line">{fields.description}</span>
          }
        />
      </ManagedPageContent>
      <Container className="py-[50px]">
        <PostGrid posts={posts} />
      </Container>
      <NewsletterSignup />
    </>
  );
}
