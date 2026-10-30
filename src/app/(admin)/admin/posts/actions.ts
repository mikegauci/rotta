"use server";

import { revalidatePath, updateTag } from "next/cache";
import { assertAdmin } from "@/lib/auth/admin";
import { RESERVED_SLUGS, slugify } from "@/lib/slug";
import { Constants, type Enums } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type PostInput = {
  id: string | null;
  title: string;
  slug: string;
  subtitle: string;
  excerpt: string;
  content: string;
  status: Enums<"publish_status">;
  publishedAt: string | null; // ISO
  authorId: string | null;
  featuredMediaId: string | null;
  heroMediaId: string | null;
  categoryIds: string[];
  tags: string[]; // names
  seo: { title?: string; description?: string; noindex?: boolean };
};

export type SaveResult = { error: string } | { id: string; slug: string };

function refresh(slugs: string[]) {
  // The public blog reads are cached under these tags.
  updateTag("posts");
  for (const slug of slugs) updateTag(`post:${slug}`);
  revalidatePath("/admin/posts/");
}

export async function savePost(input: PostInput): Promise<SaveResult> {
  await assertAdmin("posts");

  const title = input.title.trim();
  const slug = slugify(input.slug || title);
  if (!title) return { error: "Add a title." };
  if (!slug) return { error: "Add a URL slug." };
  if (RESERVED_SLUGS.has(slug))
    return { error: `“/${slug}/” is used by another part of the site.` };
  if (!Constants.public.Enums.publish_status.includes(input.status))
    return { error: "Unknown status." };

  const supabase = await createClient();

  // Posts share the root of the site with free-form pages.
  const { data: page } = await supabase
    .from("pages")
    .select("id")
    .eq("path", slug)
    .maybeSingle();
  if (page) return { error: `A page already uses “/${slug}/”.` };

  const previous = input.id
    ? (
        await supabase
          .from("posts")
          .select("slug, status")
          .eq("id", input.id)
          .single()
      ).data
    : null;

  const publishedAt =
    input.publishedAt ??
    (input.status === "published" ? new Date().toISOString() : null);

  const seo = Object.fromEntries(
    Object.entries({
      title: input.seo.title?.trim(),
      description: input.seo.description?.trim(),
      noindex: input.seo.noindex || undefined,
    }).filter(([, v]) => v),
  );

  const row = {
    title,
    slug,
    subtitle: input.subtitle.trim(),
    excerpt: input.excerpt.trim(),
    content: input.content,
    status: input.status,
    published_at: publishedAt,
    author_id: input.authorId,
    featured_media_id: input.featuredMediaId,
    hero_media_id: input.heroMediaId,
    seo,
  };

  const saved = input.id
    ? await supabase
        .from("posts")
        .update(row)
        .eq("id", input.id)
        .select("id")
        .single()
    : await supabase.from("posts").insert(row).select("id").single();
  if (saved.error) {
    if (saved.error.code === "23505")
      return { error: `Another post already uses “/${slug}/”.` };
    return { error: saved.error.message };
  }
  const id = saved.data.id;

  const tagIds = await ensureTags(supabase, input.tags);
  if ("error" in tagIds) return tagIds;

  const links = await Promise.all([
    supabase.from("post_category_links").delete().eq("post_id", id),
    supabase.from("post_tag_links").delete().eq("post_id", id),
  ]);
  const linkError = links.find((r) => r.error)?.error;
  if (linkError) return { error: linkError.message };

  const inserts = await Promise.all([
    input.categoryIds.length
      ? supabase.from("post_category_links").insert(
          input.categoryIds.map((category_id) => ({
            post_id: id,
            category_id,
          })),
        )
      : null,
    tagIds.ids.length
      ? supabase
          .from("post_tag_links")
          .insert(tagIds.ids.map((tag_id) => ({ post_id: id, tag_id })))
      : null,
  ]);
  const insertError = inserts.find((r) => r?.error)?.error;
  if (insertError) return { error: insertError.message };

  // Keep old links working when a live post is renamed.
  if (previous && previous.slug !== slug && previous.status === "published") {
    await supabase
      .from("redirects")
      .upsert(
        { source: `/${previous.slug}/`, destination: `/${slug}/` },
        { onConflict: "source" },
      );
    await supabase.from("redirects").delete().eq("source", `/${slug}/`);
  }

  refresh(previous ? [previous.slug, slug] : [slug]);
  revalidatePath(`/admin/posts/${id}/`);
  return { id, slug };
}

async function ensureTags(
  supabase: Awaited<ReturnType<typeof createClient>>,
  names: string[],
): Promise<{ ids: string[] } | { error: string }> {
  const wanted = new Map<string, string>();
  for (const name of names) {
    const clean = name.trim();
    const slug = slugify(clean);
    if (slug && !wanted.has(slug)) wanted.set(slug, clean);
  }
  if (!wanted.size) return { ids: [] };

  const { data, error } = await supabase
    .from("post_tags")
    .upsert(
      [...wanted].map(([slug, name]) => ({ slug, name })),
      { onConflict: "slug", ignoreDuplicates: true },
    )
    .select("id");
  if (error) return { error: error.message };

  // ignoreDuplicates skips existing rows in the result, so read them all back.
  const { data: all, error: readError } = await supabase
    .from("post_tags")
    .select("id")
    .in("slug", [...wanted.keys()]);
  if (readError) return { error: readError.message };
  return { ids: (all ?? data ?? []).map((t) => t.id) };
}

export async function deletePost(id: string) {
  await assertAdmin("posts");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id)
    .select("slug")
    .single();
  if (error) return { error: error.message };
  refresh([data.slug]);
  return { ok: true };
}

export async function createCategory(name: string) {
  await assertAdmin("posts");
  const clean = name.trim();
  const slug = slugify(clean);
  if (!slug) return { error: "Add a name." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("post_categories")
    .insert({ name: clean, slug })
    .select("id, name, slug")
    .single();
  if (error) {
    if (error.code === "23505")
      return { error: "That category already exists." };
    return { error: error.message };
  }
  updateTag("posts");
  return { category: data };
}
