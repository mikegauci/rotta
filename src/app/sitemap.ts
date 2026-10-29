import { getStandalonePages } from "@/lib/static-pages";
import { RESERVED_SLUGS } from "@/lib/slug";
import type { Seo } from "@/lib/seo";
import type { MetadataRoute } from "next";
import { getArchiveParams, getPostSummaries } from "@/lib/blog";
import { getDirectory } from "@/lib/directory";
import { env } from "@/lib/env";
import { getEvents } from "@/lib/events";
import { getProducts } from "@/lib/shop";

// Replaces Yoast's sitemap index (old *-sitemap.xml URLs redirect here).
// Like Yoast, it skips author archives; marketplace and account pages are
// noindex.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, tags, directory, events, products, pages] =
    await Promise.all([
      getPostSummaries(),
      getArchiveParams("category"),
      getArchiveParams("tag"),
      getDirectory(),
      getEvents(),
      getProducts(),
      getStandalonePages(),
    ]);
  const url = (path: string, lastModified?: string | null) => ({
    url: `${env.siteUrl}${path}`,
    ...(lastModified ? { lastModified } : {}),
  });

  return [
    ...[
      "/",
      "/blog/",
      "/directory/",
      "/events/",
      "/watch/",
      "/shop/",
      "/contact-us/",
      "/privacy-policy/",
    ].map((path) => url(path)),
    ...pages
      .filter(
        (p) => p.path && !RESERVED_SLUGS.has(p.path) && !(p.seo as Seo).noindex,
      )
      .map((p) => url(`/${p.path}/`, p.updated_at)),
    ...posts.map((p) => url(`/${p.slug}/`, p.publishedAt)),
    ...categories.map((slug) => url(`/category/${slug}/`)),
    ...tags.map((slug) => url(`/tag/${slug}/`)),
    ...directory.listings.map((b) => url(`/directory/${b.slug}/`)),
    ...events.map((e) => url(`/events/${e.slug}/`)),
    ...products.map((p) => url(`/product/${p.slug}/`)),
  ];
}
