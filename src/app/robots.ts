import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { isLiveSite } from "@/lib/seo";

// Only rotta.mt is indexed: previews and the Vercel alias block all crawlers.
export default function robots(): MetadataRoute.Robots {
  if (!isLiveSite) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      disallow: [
        "/admin/",
        "/api/",
        "/auth/",
        "/preview/",
        "/cart/",
        "/checkout/",
        "/my-business/",
        // Filter and calendar-month combinations are endless and each one
        // is rendered on demand. The pages themselves stay crawlable.
        "/directory/search-results/?",
        "/events/?",
      ],
    },
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
