import { getPageImage, getStaticPage } from "@/lib/static-pages";
import { StaticPageContent } from "@/components/managed-page-content";
import type { Seo } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostArticle } from "@/components/blog/post-article";
import { getAdjacentPosts, getPost, getPostSummaries } from "@/lib/blog";
import { notFoundMetadata, pageMetadata } from "@/lib/seo";

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
  if (!post) {
    const page = await getStaticPage(slug);
    if (!page) return notFoundMetadata;
    return pageMetadata({
      name: page.title,
      path: `/${page.path}/`,
      seo: page.seo as Seo,
      image: page.hero_media_id
        ? (await getPageImage(page.hero_media_id))?.path
        : null,
    });
  }
  const image = post.thumbnail ?? post.hero;
  return pageMetadata({
    name: post.title,
    path: `/${post.slug}/`,
    seo: post.seo,
    description: post.excerpt,
    image: image?.path,
    type: "article",
    publishedTime: post.publishedAt,
  });
}

async function PostView({ params }: Pick<PageProps<"/[slug]">, "params">) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    const page = await getStaticPage(slug);
    if (!page) notFound();
    return <StaticPageContent page={page} />;
  }
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
