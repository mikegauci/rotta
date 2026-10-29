import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import type { PostSummary } from "@/lib/blog";
import { mediaUrl } from "@/lib/media";

// Astra's archive layout (category, tag and author pages).
export function Archive({
  title,
  posts,
  page,
  pageCount,
  basePath,
}: {
  title: string;
  posts: PostSummary[];
  page: number;
  pageCount: number;
  basePath: string;
}) {
  return (
    <Container className="my-16">
      <section className="mb-10 border-b border-[#ddd] pb-[21px]">
        <h1 className="text-brand mb-1 text-[40px] leading-10 font-light capitalize">
          {title}
        </h1>
      </section>
      {posts.map((post, i) => (
        <ArchiveItem key={post.slug} post={post} priority={i === 0} />
      ))}
      {pageCount > 1 && (
        <Pagination page={page} pageCount={pageCount} basePath={basePath} />
      )}
    </Container>
  );
}

function ArchiveItem({
  post,
  priority,
}: {
  post: PostSummary;
  priority: boolean;
}) {
  const href = `/${post.slug}/`;
  return (
    <article className="mb-10">
      {post.thumbnail && (
        <Link href={href} className="mb-6 block">
          <Image
            src={mediaUrl(post.thumbnail.path)}
            alt={post.thumbnail.alt}
            width={post.thumbnail.width ?? 928}
            height={post.thumbnail.height ?? 608}
            priority={priority}
            sizes="(min-width: 1210px) 928px, 100vw"
            className="h-auto max-w-full"
          />
        </Link>
      )}
      <header className="mb-4">
        <h2 className="text-heading mb-1.5 text-[30px] leading-[39px]">
          <Link href={href} className="text-body">
            {post.title}
          </Link>
        </h2>
        <div className="text-brand text-base leading-[23.2px]">
          {post.categories.map((c, i) => (
            <span key={c.slug}>
              {i > 0 && ", "}
              <Link href={`/category/${c.slug}/`}>{c.name}</Link>
            </span>
          ))}
          {post.author && (
            <>
              {post.categories.length > 0 && " / "}
              By{" "}
              <Link href={`/author/${post.author.username}/`}>
                {post.author.name}
              </Link>
            </>
          )}
        </div>
      </header>
      <p className="text-base leading-6">{post.excerpt}</p>
    </article>
  );
}

function Pagination({
  page,
  pageCount,
  basePath,
}: {
  page: number;
  pageCount: number;
  basePath: string;
}) {
  const href = (n: number) => (n === 1 ? basePath : `${basePath}page/${n}/`);
  return (
    <nav
      aria-label="Posts pagination"
      className="flex justify-center gap-4 pt-8 text-[17px] leading-[37px]"
    >
      {page > 1 && <Link href={href(page - 1)}>← Previous Page</Link>}
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) =>
        n === page ? (
          <span key={n} aria-current="page" className="w-10 text-center">
            {n}
          </span>
        ) : (
          <Link key={n} href={href(n)} className="w-10 text-center">
            {n}
          </Link>
        ),
      )}
      {page < pageCount && <Link href={href(page + 1)}>Next Page →</Link>}
    </nav>
  );
}
