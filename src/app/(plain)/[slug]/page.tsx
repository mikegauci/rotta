import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostArticle } from "@/components/blog/post-article";
import { getAdjacentPosts, getPost, getPostSummaries } from "@/lib/blog";
import { mediaUrl } from "@/lib/media";

// Blog posts live at the site root (/mustang-bullitt-50th-anniversary/), as
// on WordPress. Static routes always win over this catch-all.
export async function generateStaticParams() {
  const posts = await getPostSummaries();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  const image = post.thumbnail ?? post.hero;
  return {
    title: post.seo.title || post.title,
    description: post.seo.description || post.excerpt || undefined,
    robots: post.seo.noindex ? { index: false } : undefined,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt || undefined,
      publishedTime: post.publishedAt ?? undefined,
      images: image ? [mediaUrl(image.path)] : undefined,
    },
  };
}

async function PostView({ params }: Pick<PageProps<"/[slug]">, "params">) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const { previous, next } = await getAdjacentPosts(slug);

  return <PostArticle post={post} previous={previous} next={next} />;
}

export default function PostPage(props: PageProps<"/[slug]">) {
  return (
    <Suspense>
      <PostView params={props.params} />
    </Suspense>
  );
}
