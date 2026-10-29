import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostContent } from "@/components/blog/post-content";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/page-hero";
import { getAdjacentPosts, getPost, getPostSummaries } from "@/lib/blog";
import { formatPostDate } from "@/lib/format";
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

  return (
    <article>
      <PageHero image={post.hero} title={post.title} subtitle={post.subtitle} />
      <Container>
        <PostContent
          html={post.content}
          slug={post.slug}
          author={post.author?.name ?? null}
        />
        <div className="text-brand mb-8">
          {post.categories.map((c, i) => (
            <span key={c.slug}>
              {i > 0 && ", "}
              <Link href={`/category/${c.slug}/`}>{c.name}</Link>
            </span>
          ))}
          {post.categories.length > 0 && " / "}
          <time dateTime={post.publishedAt ?? undefined}>
            {formatPostDate(post.publishedAt)}
          </time>
        </div>
        {(previous || next) && (
          <nav
            aria-label="Posts"
            className="text-brand flex justify-between border-t border-[#ddd] py-[30px] text-[15.5px] leading-[33px]"
          >
            <span>
              {previous && (
                <Link href={`/${previous.slug}/`} rel="prev">
                  ← Previous Post
                </Link>
              )}
            </span>
            <span>
              {next && (
                <Link href={`/${next.slug}/`} rel="next">
                  Next Post →
                </Link>
              )}
            </span>
          </nav>
        )}
      </Container>
    </article>
  );
}

export default function PostPage(props: PageProps<"/[slug]">) {
  return (
    <Suspense>
      <PostView params={props.params} />
    </Suspense>
  );
}
