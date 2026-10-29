import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { publicDb } from "@/lib/supabase/public";

// Archives show 10 posts per page, like the live site.
export const ARCHIVE_PAGE_SIZE = 10;

export type MediaInfo = {
  path: string;
  width: number | null;
  height: number | null;
  alt: string;
};

export type Term = { slug: string; name: string };

export type PostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string | null;
  thumbnail: MediaInfo | null;
  author: { username: string; name: string } | null;
  categories: Term[];
};

export type Post = PostSummary & {
  id: string;
  subtitle: string;
  content: string;
  hero: MediaInfo | null;
  updatedAt: string;
  tags: Term[];
  seo: { title?: string; description?: string; noindex?: boolean };
};

const SUMMARY = `id, slug, title, excerpt, published_at, author_id,
  thumbnail:media!posts_featured_media_id_fkey(path, width, height, alt),
  categories:post_categories(slug, name)`;

type SummaryRow = {
  slug: string;
  title: string;
  excerpt: string;
  published_at: string | null;
  author_id: string | null;
  thumbnail: MediaInfo | null;
  categories: Term[];
};

async function authors() {
  const { data } = await publicDb.rpc("post_authors");
  return new Map(
    (data ?? []).map((a) => [
      a.id,
      { username: a.username ?? "", name: a.full_name || a.username || "" },
    ]),
  );
}

function toSummary(
  row: SummaryRow,
  byId: Map<string, { username: string; name: string }>,
): PostSummary {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    publishedAt: row.published_at,
    thumbnail: row.thumbnail,
    author: row.author_id ? (byId.get(row.author_id) ?? null) : null,
    categories: row.categories ?? [],
  };
}

export async function getPostSummaries(): Promise<PostSummary[]> {
  "use cache";
  cacheTag("posts");
  cacheLife("hours");
  const [{ data, error }, byId] = await Promise.all([
    publicDb
      .from("posts")
      .select(SUMMARY)
      .eq("status", "published")
      .order("published_at", { ascending: false }),
    authors(),
  ]);
  if (error) throw error;
  return (data as unknown as SummaryRow[]).map((r) => toSummary(r, byId));
}

export async function getRecentPosts(limit = 4) {
  return (await getPostSummaries()).slice(0, limit);
}

export async function getPost(slug: string): Promise<Post | null> {
  "use cache";
  cacheTag("posts", `post:${slug}`);
  cacheLife("hours");
  const [{ data, error }, byId] = await Promise.all([
    publicDb
      .from("posts")
      .select(
        `${SUMMARY}, subtitle, content, updated_at, seo,
        hero:media!posts_hero_media_id_fkey(path, width, height, alt),
        tags:post_tags(slug, name)`,
      )
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle(),
    authors(),
  ]);
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as SummaryRow & {
    id: string;
    subtitle: string;
    content: string;
    updated_at: string;
    seo: Post["seo"];
    hero: MediaInfo | null;
    tags: Term[];
  };
  return {
    ...toSummary(row, byId),
    id: row.id,
    subtitle: row.subtitle,
    content: row.content,
    hero: row.hero,
    updatedAt: row.updated_at,
    tags: row.tags ?? [],
    seo: row.seo ?? {},
  };
}

// Previous (older) and next (newer) posts, for the links under a post.
export async function getAdjacentPosts(slug: string) {
  const posts = await getPostSummaries();
  const i = posts.findIndex((p) => p.slug === slug);
  return {
    previous: i >= 0 ? (posts[i + 1] ?? null) : null,
    next: i > 0 ? posts[i - 1] : null,
  };
}

export type ArchiveKind = "category" | "tag" | "author";

export async function getArchive(kind: ArchiveKind, slug: string) {
  "use cache";
  cacheTag("posts");
  cacheLife("hours");
  const posts = await getPostSummaries();
  if (kind === "author") {
    const matches = posts.filter((p) => p.author?.username === slug);
    return matches.length
      ? { title: matches[0].author!.name, posts: matches }
      : null;
  }
  const table = kind === "category" ? "post_categories" : "post_tags";
  const { data: term } = await publicDb
    .from(table)
    .select("slug, name, posts(slug)")
    .eq("slug", slug)
    .maybeSingle();
  if (!term) return null;
  const slugs = new Set((term.posts ?? []).map((p) => p.slug));
  return { title: term.name, posts: posts.filter((p) => slugs.has(p.slug)) };
}

export async function getArchiveParams(kind: ArchiveKind) {
  "use cache";
  cacheTag("posts");
  const posts = await getPostSummaries();
  if (kind === "author") {
    return [
      ...new Set(posts.map((p) => p.author?.username).filter(Boolean)),
    ] as string[];
  }
  const { data } = await publicDb
    .from(kind === "category" ? "post_categories" : "post_tags")
    .select("slug");
  return (data ?? []).map((t) => t.slug);
}

// Hero image for a page laid out in code (e.g. "blog").
export async function getPageHero(path: string): Promise<MediaInfo | null> {
  "use cache";
  cacheTag("pages");
  cacheLife("days");
  const { data } = await publicDb
    .from("pages")
    .select("hero:media!pages_hero_media_id_fkey(path, width, height, alt)")
    .eq("path", path)
    .maybeSingle();
  return (data?.hero as MediaInfo | null) ?? null;
}
