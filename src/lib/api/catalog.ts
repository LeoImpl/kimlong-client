import { cacheLife, cacheTag } from "next/cache";
import { apiFetch, apiFetchOrNull } from "./client";
import type { Brand, CategoryNode, Page, ProductDetail, ProductSummary } from "./types";

/**
 * Catalogue reads.
 *
 * In Next 16 `fetch` is uncached by default, so each function opts in with `use cache`. The catalogue changes
 * rarely — 104 products, edited by staff, not by customers — which makes it a good fit for long-lived caching
 * with tag-based invalidation once an admin UI exists (plan v2).
 *
 * Search is deliberately NOT cached: `?q=` is unbounded user input, so caching it would fill the cache with
 * one-hit entries. Category and brand listings are cached hard because they are on every page.
 */

const TAGS = {
  categories: "catalog:categories",
  brands: "catalog:brands",
  product: (slug: string) => `catalog:product:${slug}`,
} as const;

export async function getCategories(): Promise<CategoryNode[]> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.categories);
  return apiFetch<CategoryNode[]>("/api/public/v1/catalog/categories");
}

export async function getBrands(): Promise<Brand[]> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.brands);
  return apiFetch<Brand[]>("/api/public/v1/catalog/brands");
}

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.product(slug));
  return apiFetchOrNull<ProductDetail>(
    `/api/public/v1/catalog/products/${encodeURIComponent(slug)}`,
  );
}

export interface ProductSearch {
  q?: string;
  category?: string;
  brand?: string;
  page?: number;
  size?: number;
}

/** Uncached: driven by user input. Callers should stream it behind `<Suspense>`. */
export async function searchProducts(criteria: ProductSearch = {}): Promise<Page<ProductSummary>> {
  return apiFetch<Page<ProductSummary>>("/api/public/v1/catalog/products", {
    query: {
      q: criteria.q,
      category: criteria.category,
      brand: criteria.brand,
      page: criteria.page ?? 0,
      size: criteria.size ?? 20,
    },
  });
}

/**
 * Products of one category, cached because the listing is stable and linked from navigation.
 * `category` includes subcategories on the API side.
 */
export async function getCategoryProducts(
  category: string,
  page = 0,
  size = 20,
): Promise<Page<ProductSummary>> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.categories, `catalog:category:${category}`);
  return apiFetch<Page<ProductSummary>>("/api/public/v1/catalog/products", {
    query: { category, page, size },
  });
}

/** Flattens the category tree, for navigation and for generating routes. */
export function flattenCategories(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.flatMap((node) => [node, ...flattenCategories(node.children ?? [])]);
}
