import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Keep the WordPress URL style (/directory/, /shop/...) for SEO parity.
  trailingSlash: true,
  redirects() {
    return [
      {
        source: "/shop/page/:page([0-9]+)/",
        destination: "/shop/",
        permanent: true,
      },
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
