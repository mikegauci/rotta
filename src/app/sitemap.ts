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
  const [posts, categories, tags, directory, events, products] =
    await Promise.all([
      getPostSummaries(),
      getArchiveParams("category"),
      getArchiveParams("tag"),
      getDirectory(),
      getEvents(),
      getProducts(),
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
    ...posts.map((p) => url(`/${p.slug}/`, p.publishedAt)),
    ...categories.map((slug) => url(`/category/${slug}/`)),
    ...tags.map((slug) => url(`/tag/${slug}/`)),
    ...directory.listings.map((b) => url(`/directory/${b.slug}/`)),
    ...events.map((e) => url(`/events/${e.slug}/`)),
    ...products.map((p) => url(`/product/${p.slug}/`)),
  ];
}
