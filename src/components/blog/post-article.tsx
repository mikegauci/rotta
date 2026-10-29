import Link from "next/link";
import { PostContent } from "@/components/blog/post-content";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/page-hero";
import type { Post, PostSummary } from "@/lib/blog";
import { formatPostDate } from "@/lib/format";

export function PostArticle({
  post,
  previous,
  next,
}: {
  post: Post;
  previous: PostSummary | null;
  next: PostSummary | null;
}) {
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
