import Image from "next/image";
import Link from "next/link";
import { FaCalendarAlt, FaTag, FaUser } from "react-icons/fa";
import type { PostSummary } from "@/lib/blog";
import { formatPostDate } from "@/lib/format";
import { mediaUrl } from "@/lib/media";

// Card from the /blog/ post grid (Spectra post grid block).
export function PostCard({
  post,
  priority,
}: {
  post: PostSummary;
  priority?: boolean;
}) {
  const href = `/${post.slug}/`;
  return (
    <article className="mb-5 px-2.5">
      <div className="h-full bg-[#e4e4e4] p-5">
        {post.thumbnail && (
          <Link href={href} className="-mx-5 -mt-5 mb-[15px] block">
            <Image
              src={mediaUrl(post.thumbnail.path)}
              alt={post.thumbnail.alt}
              width={post.thumbnail.width ?? 928}
              height={post.thumbnail.height ?? 608}
              priority={priority}
              sizes="(min-width: 922px) 380px, (min-width: 768px) 50vw, 100vw"
              className="h-auto w-full"
            />
          </Link>
        )}
        <h3 className="mb-[15px] text-[19px] leading-[19px] font-semibold text-[#3b3b3b]">
          <Link href={href}>{post.title}</Link>
        </h3>
        <div className="mb-[15px] text-[11px] leading-[16.5px] tracking-[1px] text-[#777] capitalize">
          {post.author && (
            <span className="mr-2.5 inline-flex items-center gap-1">
              <FaUser aria-hidden className="size-2.5" />
              <Link href={`/author/${post.author.username}/`}>
                {post.author.name}
              </Link>
            </span>
          )}
          <time
            dateTime={post.publishedAt ?? undefined}
            className="mr-2.5 inline-flex items-center gap-1"
          >
            <FaCalendarAlt aria-hidden className="size-2.5" />
            {formatPostDate(post.publishedAt)}
          </time>
          {post.categories.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <FaTag aria-hidden className="size-2.5" />
              {post.categories.map((c, i) => (
                <span key={c.slug}>
                  {i > 0 && ", "}
                  <Link href={`/category/${c.slug}/`}>{c.name}</Link>
                </span>
              ))}
            </span>
          )}
        </div>
        <p className="mb-[25px] text-base leading-6">{post.excerpt}</p>
        <Link
          href={href}
          className="inline-block bg-[#333] px-2.5 py-[5px] text-base leading-6 font-bold text-white"
        >
          Read More
        </Link>
      </div>
    </article>
  );
}

export function PostGrid({ posts }: { posts: PostSummary[] }) {
  return (
    <div className="-mx-2.5 grid desk:grid-cols-3 sm:grid-cols-2">
      {posts.map((post, i) => (
        <PostCard key={post.slug} post={post} priority={i < 3} />
      ))}
    </div>
  );
}
