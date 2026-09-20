import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getBrands, getCategories, flattenCategories, getProductSlugs } from "@/lib/api/catalog";
import { env } from "@/lib/env";
import { routes } from "@/lib/routes";

/**
 * The sitemap is built from the API's slug feed (`GET /catalog/products/slugs`), which exists for exactly this:
 * it returns a slug and a last-changed timestamp per published product, so `<lastmod>` is real rather than
 * "today" — and Google re-crawls the pages that actually changed.
 *
 * Everything it reads is cached, so this costs one API round trip per cache period, not one per crawl.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Without this Next would prerender the sitemap during `next build`, which would make every CI run and image
  // build depend on a reachable API — the thing Phase 0 deliberately removed. The three reads below are all
  // `use cache`, so serving it at request time costs nothing after the first crawl.
  await connection();

  const [products, categories, brands] = await Promise.all([
    getProductSlugs(),
    getCategories(),
    getBrands(),
  ]);

  const url = (path: string) => `${env.siteUrl}${path}`;

  return [
    { url: url(routes.home), changeFrequency: "weekly", priority: 1 },
    { url: url(routes.products), changeFrequency: "weekly", priority: 0.8 },
    { url: url(routes.categories), changeFrequency: "monthly", priority: 0.6 },
    { url: url(routes.brands), changeFrequency: "monthly", priority: 0.6 },
    { url: url(routes.about), changeFrequency: "yearly", priority: 0.5 },
    { url: url(routes.contact), changeFrequency: "yearly", priority: 0.5 },

    ...flattenCategories(categories).map((category) => ({
      url: url(routes.category(category.slug)),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),

    ...brands.map((brand) => ({
      url: url(routes.brand(brand.slug)),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),

    // The pages that earn the traffic: one per product, with the date it really changed.
    ...products.map((product) => ({
      url: url(routes.product(product.slug)),
      lastModified: new Date(product.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}
