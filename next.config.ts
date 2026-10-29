import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Keep the WordPress URL style (/directory/, /shop/...) for SEO parity.
  trailingSlash: true,
  images: {
    remotePatterns: [
      new URL(
        "https://wdctbixfjvwbvqlylpuf.supabase.co/storage/v1/object/public/**",
      ),
    ],
  },
  partialPrefetching: true,
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
