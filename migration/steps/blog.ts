// Blog posts, categories and tags. Comments are skipped (all spam).
import type { Json } from "../../src/lib/supabase/database.types.ts";
import { extractHero } from "../lib/blocks.ts";
import type { Context } from "../lib/context.ts";
import { decodeEntities, wpDate } from "../lib/wp.ts";

export function seoFrom(
  ctx: Context,
  meta: Map<string, string> | undefined,
): { [key: string]: Json } {
  if (!meta) return {};
  const seo: { [key: string]: Json } = {};
  const title = meta.get("_yoast_wpseo_title");
  const description = meta.get("_yoast_wpseo_metadesc");
  // Yoast titles contain variables like %%sep%%; keep only plain ones.
  if (title && !title.includes("%%")) seo.title = decodeEntities(title);
  if (description && !description.includes("%%"))
    seo.description = decodeEntities(description);
  if (meta.get("_yoast_wpseo_meta-robots-noindex") === "1") seo.noindex = true;
  const canonical = meta.get("_yoast_wpseo_canonical");
  if (canonical) seo.canonical = canonical;
  const og = meta.get("_yoast_wpseo_opengraph-image-id");
  if (og) {
    const ref = ctx.media.byAttachment(og);
    if (ref) seo.og_media_id = ref.id;
  }
  return seo;
}

export function importBlog(ctx: Context, users: Map<string, string>) {
  const posts = ctx.wp.all(
    "select * from wp_posts where post_type = 'post' and post_status in ('publish', 'draft', 'future') order by cast(ID as integer)",
  );
  const meta = ctx.wp.postMeta(posts.map((p) => p.ID!));

  const categories = new Map<
    string,
    {
      id: string;
      wp_id: number;
      slug: string;
      name: string;
      description: string;
    }
  >();
  const tags = new Map<
    string,
    { id: string; wp_id: number; slug: string; name: string }
  >();
  const categoryLinks: { post_id: string; category_id: string }[] = [];
  const tagLinks: { post_id: string; tag_id: string }[] = [];

  const rows = posts.map((p) => {
    const id = ctx.id("posts", p.ID!);
    const m = meta.get(p.ID!);
    const hero = extractHero(p.post_content);
    for (const t of ctx.wp.termsFor(p.ID!, "category")) {
      if (t.slug === "uncategorized") continue;
      const cid = ctx.id("post_categories", t.term_id!);
      categories.set(t.term_id!, {
        id: cid,
        wp_id: Number(t.term_id),
        slug: t.slug!,
        name: decodeEntities(t.name!),
        description: t.description ?? "",
      });
      categoryLinks.push({ post_id: id, category_id: cid });
    }
    for (const t of ctx.wp.termsFor(p.ID!, "post_tag")) {
      const tid = ctx.id("post_tags", t.term_id!);
      tags.set(t.term_id!, {
        id: tid,
        wp_id: Number(t.term_id),
        slug: t.slug!,
        name: decodeEntities(t.name!),
      });
      tagLinks.push({ post_id: id, tag_id: tid });
    }
    return {
      id,
      wp_id: Number(p.ID),
      slug: p.post_name!,
      title: decodeEntities(p.post_title!),
      excerpt: decodeEntities(p.post_excerpt ?? ""),
      subtitle: hero.subtitle,
      hero_media_id: hero.imageUrl
        ? (ctx.media.byUrl(hero.imageUrl)?.id ?? null)
        : null,
      content: ctx.html(hero.rest),
      featured_media_id:
        ctx.media.byAttachment(m?.get("_thumbnail_id"))?.id ?? null,
      author_id: users.get(p.post_author!) ?? null,
      status:
        p.post_status === "publish"
          ? ("published" as const)
          : ("draft" as const),
      published_at: wpDate(p.post_date_gmt, p.post_date),
      seo: seoFrom(ctx, m),
      created_at: wpDate(p.post_date_gmt, p.post_date) ?? undefined,
    };
  });

  ctx.upsert("post_categories", [...categories.values()], "id");
  ctx.upsert("post_tags", [...tags.values()], "id");
  ctx.upsert("posts", rows, "id");
  ctx.upsert("post_category_links", categoryLinks, "post_id,category_id");
  ctx.upsert("post_tag_links", tagLinks, "post_id,tag_id");
  ctx.count("blog: posts", rows.length);
  ctx.count("blog: categories", categories.size);
  ctx.count("blog: tags", tags.size);
}
