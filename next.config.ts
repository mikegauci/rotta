import type { NextConfig } from "next";

type Redirect = { source: string; destination: string; permanent: boolean };

// WordPress URLs with no page of their own on the new site.
const RETIRED_WORDPRESS_URLS: Redirect[] = [
  // Yoast sitemaps.
  ...["/sitemap_index.xml", "/:name([a-z_]+-sitemap\\d*).xml"].map(
    (source) => ({ source, destination: "/sitemap.xml", permanent: true }),
  ),
  ...["/product-category/:path*/", "/product-tag/:path*/"].map((source) => ({
    source,
    destination: "/shop/",
    permanent: true,
  })),
  { source: "/frm_display/:path*/", destination: "/", permanent: true },
  ...["/directory/business-details/", "/manage-directory-detail-page/"].map(
    (source) => ({ source, destination: "/my-business/", permanent: true }),
  ),
  ...["/wp-login.php", "/wp-admin/:path*/", "/wp-admin/:file*.php"].map(
    (source) => ({
      source,
      destination: "/login/",
      permanent: false,
    }),
  ),
  ...["/feed/", "/:kind(category|tag)/:slug/feed/"].map((source) => ({
    source,
    destination: "/blog/",
    permanent: true,
  })),
];

// The `redirects` table (imported Redirection rules, CMS slug renames and
// admin-made redirects) as it stands at build time.
async function tableRedirects(): Promise<Redirect[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  try {
    const res = await fetch(
      `${url}/rest/v1/redirects?select=source,destination,permanent`,
      { headers: { apikey: key } },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = (await res.json()) as Redirect[];
    return rows
      .filter((r) => /^\/[A-Za-z0-9\-._~%/]*$/.test(r.source))
      .map((r) => ({
        source: r.source.endsWith("/") ? r.source : `${r.source}/`,
        destination: r.destination,
        permanent: r.permanent,
      }));
  } catch (error) {
    // The runtime fallback still serves them.
    console.warn("redirects table not loaded at build time:", error);
    return [];
  }
}

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Keep the WordPress URL style (/directory/, /shop/...) for SEO parity.
  trailingSlash: true,
  // Served by the CDN without running any code. Rules added to the table
  // after a deploy are picked up by `redirectOrNotFound` until the next one.
  async redirects() {
    return [
      {
        source: "/shop/page/:page([0-9]+)/",
        destination: "/shop/",
        permanent: true,
      },
      // 301/302 as before, not Next's default 308/307.
      ...[...RETIRED_WORDPRESS_URLS, ...(await tableRedirects())].map(
        ({ permanent, ...rule }) => ({
          ...rule,
          statusCode: permanent ? (301 as const) : (302 as const),
        }),
      ),
    ];
  },
  images: {
    remotePatterns: [
      new URL(
        "https://wdctbixfjvwbvqlylpuf.supabase.co/storage/v1/object/public/**",
      ),
    ],
  },
  partialPrefetching: true,
  // Next.js renders every page on the server for the crawlers on this list
  // (Facebook, Bing, Apple...) so their metadata is never streamed, which
  // skips the prerendered copy and bills a function run per crawler hit.
  // Prerendered pages already carry their metadata in <head>, so no crawler
  // needs that: the pattern below matches none of them.
  htmlLimitedBots: /rotta-no-html-limited-bots/,
  // Event posters are shrunk in the browser first; this is the safety cap.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
