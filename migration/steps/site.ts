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
      seo: seoFrom(ctx, meta.get(p.ID!), p.post_title ?? ""),
      created_at: wpDate(p.post_date_gmt, p.post_date) ?? undefined,
    };
  });
  ctx.upsert("pages", pageRows, "id");
  ctx.count("pages (content + SEO)", pageRows.length);

  // Marketplace vehicles are child pages of /marketplace/, built by hand from
  // blocks. The listing cards (status, price, year) live on /marketplace/
  // itself; a vehicle without a card there was not shown, so it stays hidden.
  const marketplace = ctx.wp.get(
    "select ID, post_content from wp_posts where post_type = 'page' and post_name = 'marketplace' and post_parent = '0'",
  );
  const cards = new Map<string, Record<string, string>>();
  for (const m of (marketplace?.post_content ?? "").matchAll(
    /<!-- wp:acf\/marketplace-listing-block (\{[\s\S]*?\}) \/-->/g,
  )) {
    const data = JSON.parse(m[1]).data as Record<string, string>;
    const slug = /\/marketplace\/([^/]+)/.exec(data.listing_link ?? "")?.[1];
    if (slug) cards.set(slug, data);
  }
  const vehicles = marketplace
    ? ctx.wp.all(
        "select * from wp_posts where post_type = 'page' and post_parent = ? and post_status = 'publish'",
        marketplace.ID!,
      )
    : [];
  const vehicleMeta = ctx.wp.postMeta(vehicles.map((v) => v.ID!));
  const gallery: {
    vehicle_id: string;
    media_id: string;
    sort_order: number;
  }[] = [];
  const vehicleRows = vehicles.map((v) => {
    const m = vehicleMeta.get(v.ID!);
    const raw = v.post_content ?? "";
    const card = cards.get(v.post_name!);
    const id = ctx.id("vehicles", v.ID!);
    const backgrounds = [
      ...raw.matchAll(/"backgroundImage":\{[^{}]*?"url":"([^"]+)"/g),
    ].map((b) => b[1]);
    const image =
      ctx.media.byAttachment(card?.listing_image) ??
      ctx.media.byAttachment(m?.get("_thumbnail_id")) ??
      (backgrounds[0] ? ctx.media.byUrl(backgrounds[0]) : null);
    const cta =
      backgrounds.length > 1
        ? ctx.media.byUrl(backgrounds[backgrounds.length - 1])
        : null;
    const ids =
      /wp:getwid\/images-slider \{"align":"full","ids":\[([\d,]+)\]/.exec(
        raw,
      )?.[1];
    for (const [order, wpId] of (ids ?? "")
      .split(",")
      .filter(Boolean)
      .entries()) {
      const photo = ctx.media.byAttachment(wpId);
      if (photo)
        gallery.push({ vehicle_id: id, media_id: photo.id, sort_order: order });
    }
    const titles = [
      ...raw.matchAll(/<h2 class="uagb-heading-text">([\s\S]*?)<\/h2>/g),
    ];
    const features =
      /<!-- wp:acf\/vehicle-details-block (\{[\s\S]*?\}) \/-->/.exec(raw);
    const status = card?.lisiting_status ?? "For Sale";
    return {
      id,
      wp_id: Number(v.ID),
      slug: v.post_name!,
      title: titles[0] ? plain(titles[0][1]) : decodeEntities(v.post_title!),
      card_title: card?.listing_title ?? "",
      price: card?.listing_price ?? (titles[1] ? plain(titles[1][1]) : ""),
      listing_status: status,
      status_color: card?.lisiting_status_color ?? "",
      year: card?.listing_date ?? "",
      content: headingText(raw, "Description"),
      condition: headingText(raw, "Condition"),
      seller_details: sellerDetails(raw),
      details: features ? vehicleFeatures(JSON.parse(features[1]).data) : {},
      body_type: features ? (JSON.parse(features[1]).data.body_type ?? "") : "",
      image_media_id: image?.id ?? null,
      cta_media_id: cta?.id ?? null,
      listed_on: card?.publishing_date
        ? `${card.publishing_date.slice(0, 4)}-${card.publishing_date.slice(4, 6)}-${card.publishing_date.slice(6, 8)}`
        : (wpDate(v.post_date_gmt, v.post_date) ?? "").slice(0, 10) || null,
      status: card ? ("published" as const) : ("draft" as const),
      seo: { ...seoFrom(ctx, m, v.post_title ?? ""), noindex: true },
      created_at: wpDate(v.post_date_gmt, v.post_date) ?? undefined,
    };
  });
  ctx.upsert("vehicles", vehicleRows, "id");
  ctx.upsert("vehicle_media", gallery, "vehicle_id,media_id");
  ctx.count("marketplace: vehicles", vehicleRows.length);
  ctx.count("marketplace: photos", gallery.length);

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

// Text of an HTML fragment, keeping <br> as line breaks.
function plain(html: string): string {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/[ \t]+\n/g, "\n"),
  ).trim();
}

// The paragraph under an advanced heading such as "Description".
function headingText(raw: string, heading: string): string {
  const m = new RegExp(
    `<h3 class="uagb-heading-text">${heading}</h3><p class="uagb-desc-text">([\\s\\S]*?)</p>`,
  ).exec(raw);
  return m ? plain(m[1]) : "";
}

function sellerDetails(raw: string): string {
  const m =
    /seller-details[\s\S]*?<p class="uagb-ifb-desc">([\s\S]*?)<\/p>/.exec(raw);
  if (!m) return "";
  return plain(m[1])
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

// The theme's "vehicle details" fields. Seats, body colour and warranty never
// showed on the live site (typos in the theme), so they import as hidden.
const FEATURE_KEYS = [
  "transmission",
  "engine_size",
  "owners",
  "doors",
  "mileage",
  "local",
  "mpg",
  "seats",
  "fuel",
  "body_type",
  "engine_number",
  "chassis_number",
  "vehicle_financing",
  "interior_colour",
  "body_colour",
  "insurance",
  "license",
  "warranty",
];
const NEVER_SHOWN = new Set(["seats", "body_colour", "warranty"]);

function vehicleFeatures(data: Record<string, string>) {
  const show: Record<string, string | undefined> = {
    ...data,
    show_body_colour: data.show_body_color,
  };
  return Object.fromEntries(
    FEATURE_KEYS.map((key) => [
      key,
      {
        value: decodeEntities(data[key] ?? ""),
        show: !NEVER_SHOWN.has(key) && show[`show_${key}`] === "yes",
      },
    ]),
  );
}
