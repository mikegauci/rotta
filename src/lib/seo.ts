import "server-only";
import type { Metadata } from "next";
import { env } from "@/lib/env";
import { mediaUrl } from "@/lib/media";
import { getStaticPage } from "@/lib/static-pages";

// The `seo` jsonb on every content type (replaces Yoast). `title` is the full
// browser title ("Watch - Rotta | Sharing a Passion"); without it the title is
// "<name> - Rotta", Yoast's default.
export type Seo = {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
};

export const GA_MEASUREMENT_ID = "G-Y1D8J24FMB";

// Only the real domain is indexed and tracked; Vercel previews and the
// production alias stay out of search results and analytics.
export const isLiveSite = new URL(env.siteUrl).hostname === "rotta.mt";

const DEFAULT_IMAGE = "/brand/og-default.jpg";

export function pageMetadata({
  name,
  path,
  seo = {},
  description,
  image,
  type = "website",
  noindex = false,
  publishedTime,
}: {
  name: string;
  path: string; // "/watch/"
  seo?: Seo;
  description?: string;
  image?: string | null; // Storage path or absolute URL
  type?: "website" | "article";
  noindex?: boolean;
  publishedTime?: string | null;
}): Metadata {
  const title = seo.title || `${name} - Rotta`;
  const text = (seo.description || description || "").trim() || undefined;
  const canonical = seo.canonical || path;
  const ogImage = image
    ? /^https?:\/\//.test(image) || image.startsWith("/")
      ? image
      : mediaUrl(image)
    : DEFAULT_IMAGE;
  return {
    title: { absolute: title },
    description: text,
    alternates: { canonical },
    robots: seo.noindex || noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type,
      locale: "en_US",
      siteName: "Rotta",
      title,
      description: text,
      url: canonical,
      images: [ogImage],
      ...(type === "article" && publishedTime ? { publishedTime } : {}),
    },
    twitter: { card: "summary_large_image" },
  };
}

// Pages laid out in code (home, watch, shop...): their SEO fields and hero
// image come from the `pages` row with the same path.
export async function codePageMetadata(
  path: string, // "watch", "" for home
  name: string,
  options: { description?: string; image?: string; noindex?: boolean } = {},
): Promise<Metadata> {
  const page = await getStaticPage(path);
  return pageMetadata({
    name,
    path: path ? `/${path}/` : "/",
    seo: (page?.seo ?? {}) as Seo,
    description: options.description,
    image: options.image,
    noindex: options.noindex,
  });
}

// For generateMetadata when the slug doesn't exist (the page then 404s).
export const notFoundMetadata: Metadata = {
  title: { absolute: "Page not found - Rotta" },
  robots: { index: false },
};
