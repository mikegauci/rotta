// Free-form pages, marketplace vehicles and redirects.
import { extractHero } from "../lib/blocks.ts";
import type { Context } from "../lib/context.ts";
import { decodeEntities, wpDate } from "../lib/wp.ts";
import { seoFrom } from "./blog.ts";

// Pages whose content is edited in the CMS. The rest (home, directory, shop,
// login...) are rebuilt in code; their SEO comes along via `pages` too.
const CONTENT_PAGES = ["privacy-policy"];
const CODE_PAGES = [
  "home",
  "blog",
  "contact-us",
  "directory",
  "events",
  "marketplace",
  "shop",
  "watch",
  "my-business",
  "login",
  "user-registration",
  "reset-password",
  "cart",
  "checkout",
];

export function importSite(ctx: Context) {
  const pages = ctx.wp.all(
    `select * from wp_posts where post_type = 'page' and post_parent = '0' and post_status = 'publish'
     and post_name in (${[...CONTENT_PAGES, ...CODE_PAGES].map(() => "?").join(",")})`,
    ...CONTENT_PAGES,
    ...CODE_PAGES,
  );
  const meta = ctx.wp.postMeta(pages.map((p) => p.ID!));
  const pageRows = pages.map((p) => {
    const hero = extractHero(p.post_content);
    return {
      id: ctx.id("pages", p.ID!),
      wp_id: Number(p.ID),
      path: p.post_name === "home" ? "" : p.post_name!,
      title: decodeEntities(p.post_title!),
      content: CONTENT_PAGES.includes(p.post_name!) ? ctx.html(hero.rest) : "",
      hero_media_id: hero.imageUrl
        ? (ctx.media.byUrl(hero.imageUrl)?.id ?? null)
        : null,
      status: "published" as const,
      seo: seoFrom(ctx, meta.get(p.ID!)),
      created_at: wpDate(p.post_date_gmt, p.post_date) ?? undefined,
    };
  });
  ctx.upsert("pages", pageRows, "id");
  ctx.count("pages (content + SEO)", pageRows.length);

  // Marketplace vehicles are child pages of /marketplace/.
  const marketplace = ctx.wp.get(
    "select ID from wp_posts where post_type = 'page' and post_name = 'marketplace' and post_parent = '0'",
  );
  const vehicles = marketplace
    ? ctx.wp.all(
        "select * from wp_posts where post_type = 'page' and post_parent = ? and post_status = 'publish'",
        marketplace.ID!,
      )
    : [];
  const vehicleMeta = ctx.wp.postMeta(vehicles.map((v) => v.ID!));
  const vehicleRows = vehicles.map((v) => {
    const m = vehicleMeta.get(v.ID!);
    const firstImage =
      /wp-content\/uploads\/([^"'\s)]+\.(?:jpe?g|png|webp))/i.exec(
        v.post_content ?? "",
      );
    const image =
      ctx.media.byAttachment(m?.get("_thumbnail_id")) ??
      (firstImage ? ctx.media.byUrl(firstImage[1]) : null);
    return {
      id: ctx.id("vehicles", v.ID!),
      wp_id: Number(v.ID),
      slug: v.post_name!,
      title: decodeEntities(v.post_title!),
      content: ctx.html(v.post_content),
      image_media_id: image?.id ?? null,
      listed_on:
        (wpDate(v.post_date_gmt, v.post_date) ?? "").slice(0, 10) || null,
      status: "published" as const,
      seo: { ...seoFrom(ctx, m), noindex: true },
      created_at: wpDate(v.post_date_gmt, v.post_date) ?? undefined,
    };
  });
  ctx.upsert("vehicles", vehicleRows, "id");
  ctx.count("marketplace: vehicles", vehicleRows.length);

  // Redirection plugin rules (paths only; full URLs on rotta.mt become paths).
  const redirects = ctx.wp
    .all(
      "select * from wp_redirection_items where status = 'enabled' and action_type = 'url'",
    )
    .map((r) => ({
      id: ctx.id("redirects", r.id!),
      source: r.url!,
      destination:
        r.action_data!.replace(/^https?:\/\/(?:www\.)?rotta\.mt/, "") || "/",
      permanent: r.action_code === "301",
    }));
  ctx.upsert("redirects", redirects, "source");
  ctx.count("redirects", redirects.length);
}
