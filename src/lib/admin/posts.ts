import "server-only";
import type { EditorPost } from "@/components/admin/post-editor";
import type { Post } from "@/lib/blog";
import { createClient } from "@/lib/supabase/server";

// Lists for the editor sidebar. Authors are admins plus anyone who already
// wrote a post.
export async function getEditorOptions() {
  const supabase = await createClient();
  const [categories, tags, admins, postAuthors] = await Promise.all([
    supabase.from("post_categories").select("id, name").order("name"),
    supabase.from("post_tags").select("name").order("name"),
    supabase
      .from("profiles")
      .select("id, username, full_name, email")
      .eq("role", "admin"),
    supabase.rpc("post_authors"),
  ]);
  const authors = new Map<string, string>();
  for (const a of admins.data ?? [])
    authors.set(a.id, a.full_name || a.username || a.email);
  for (const a of postAuthors.data ?? [])
    if (!authors.has(a.id)) authors.set(a.id, a.full_name || a.username || "");

  return {
    categories: categories.data ?? [],
    tagSuggestions: (tags.data ?? []).map((t) => t.name),
    authors: [...authors].map(([id, name]) => ({ id, name })),
  };
}

const MEDIA = "id, path, width, height, alt";

export async function getEditorPost(id: string): Promise<EditorPost | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(
      `id, title, slug, subtitle, excerpt, content, status, published_at,
      author_id, seo,
      featured:media!posts_featured_media_id_fkey(${MEDIA}),
      hero:media!posts_hero_media_id_fkey(${MEDIA}),
      categories:post_categories(id),
      tags:post_tags(name)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    subtitle: data.subtitle,
    excerpt: data.excerpt,
    content: data.content,
    status: data.status,
    publishedAt: data.published_at,
    authorId: data.author_id,
    seo: (data.seo ?? {}) as EditorPost["seo"],
    featured: data.featured,
    hero: data.hero,
    categoryIds: data.categories.map((c) => c.id),
    tags: data.tags.map((t) => t.name),
  };
}

// Any post (drafts too) in the public Post shape, for the preview page.
export async function getPreviewPost(id: string): Promise<Post | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(
      `id, slug, title, subtitle, excerpt, content, published_at, updated_at,
      seo, author:profiles(username, full_name),
      thumbnail:media!posts_featured_media_id_fkey(path, width, height, alt),
      hero:media!posts_hero_media_id_fkey(path, width, height, alt),
      categories:post_categories(slug, name),
      tags:post_tags(slug, name)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    subtitle: data.subtitle,
    excerpt: data.excerpt,
    content: data.content,
    publishedAt: data.published_at,
    updatedAt: data.updated_at,
    seo: (data.seo ?? {}) as Post["seo"],
    thumbnail: data.thumbnail,
    hero: data.hero,
    author: data.author
      ? {
          username: data.author.username ?? "",
          name: data.author.full_name || data.author.username || "",
        }
      : null,
    categories: data.categories,
    tags: data.tags,
  };
}
