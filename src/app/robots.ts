import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

/**
 * The catalogue is the whole point of this site, so everything is open. Only pages that are personal to one
 * visitor, or that would waste crawl budget, are kept out:
 *
 * - the quote basket and the confirmation page exist per visitor and hold a request reference;
 * - `/dev/ui` is the internal component gallery;
 * - `/san-pham?q=` is unbounded user input — an infinite space of near-duplicate pages. The catalogue itself is
 *   reachable through the categories, so nothing is lost by keeping crawlers out of the search box.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/yeu-cau-bao-gia", "/yeu-cau-bao-gia/", "/dev/", "/san-pham?*"],
    },
    sitemap: `${env.siteUrl}/sitemap.xml`,
    host: env.siteUrl,
  };
}
