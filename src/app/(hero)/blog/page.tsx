import type { Metadata } from "next";
import { PostGrid } from "@/components/blog/post-card";
import { Container } from "@/components/layout/container";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { PageHero } from "@/components/page-hero";
import { getPageHero, getPostSummaries } from "@/lib/blog";

export const metadata: Metadata = { title: "Blog" };

export default async function BlogPage() {
  const [hero, posts] = await Promise.all([
    getPageHero("blog"),
    getPostSummaries(),
  ]);
  return (
    <>
      <PageHero
        image={hero}
        title="Check out our blog"
        subtitle="Read what we have to say on the local automotive scene."
      />
      <Container className="py-[50px]">
        <PostGrid posts={posts} />
      </Container>
      <NewsletterSignup />
    </>
  );
}
