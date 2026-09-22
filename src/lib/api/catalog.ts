import { cacheLife, cacheTag } from "next/cache";
import { apiFetch, apiFetchOrNull } from "./client";
import type {
  Brand,
  CategoryNode,
  PartNumberMatch,
  ProductDetail,
  ProductPage,
  ProductSlug,
} from "./types";

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
  listings: "catalog:listings",
  slugs: "catalog:slugs",
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
  /** Ask for the counts the filter sidebar shows. One extra grouped query on the API side, so opt-in. */
  facets?: boolean;
}

const PAGE_SIZE = 24;

function query(criteria: ProductSearch) {
  return {
    q: criteria.q,
    category: criteria.category,
    brand: criteria.brand,
    page: criteria.page ?? 0,
    size: criteria.size ?? PAGE_SIZE,
    facets: criteria.facets ? true : undefined,
  };
}

/**
 * Free-text search. Deliberately NOT cached: `?q=` is unbounded user input, so caching it would fill the cache
 * with entries nobody asks for twice. Callers stream it behind `<Suspense>`.
 */
export async function searchProducts(criteria: ProductSearch): Promise<ProductPage> {
  return apiFetch<ProductPage>("/api/public/v1/catalog/products", { query: query(criteria) });
}

/**
 * Browsing a category or a brand. The same endpoint, but the inputs are a closed set — sixteen categories,
 * fourteen brands, a page number — so every combination is worth caching and is linked from navigation.
 */
export async function listProducts(criteria: ProductSearch): Promise<ProductPage> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.listings);
  return apiFetch<ProductPage>("/api/public/v1/catalog/products", { query: query(criteria) });
}

/**
 * Every published product's slug and last change. Small (104 rows today) and cached, which is what lets the
 * sitemap and `generateStaticParams` stay cheap as the catalogue grows.
 */
export async function getProductSlugs(): Promise<ProductSlug[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.slugs);
  return apiFetch<ProductSlug[]>("/api/public/v1/catalog/products/slugs");
}

/** The API's limit per lookup; the quick order page caps its rows at the same number. */
export const MAX_PART_NUMBER_LOOKUP = 100;

/**
 * Resolves a buyer's list of part numbers in one request (quick order). Uncached for the same reason as search:
 * the input is whatever was pasted. Unknown part numbers are simply absent from the result.
 */
export async function lookupPartNumbers(partNumbers: string[]): Promise<PartNumberMatch[]> {
  if (partNumbers.length === 0) return [];
  const search = new URLSearchParams(partNumbers.map((value) => ["pn", value]));
  return apiFetch<PartNumberMatch[]>(`/api/public/v1/catalog/part-numbers?${search}`);
}

/** Flattens the category tree, for navigation and for generating routes. */
export function flattenCategories(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.flatMap((node) => [node, ...flattenCategories(node.children ?? [])]);
}

/** The path from a root category down to [slug], for breadcrumbs built without a product. */
export function categoryPath(nodes: CategoryNode[], slug: string): CategoryNode[] {
  for (const node of nodes) {
    if (node.slug === slug) return [node];
    const below = categoryPath(node.children ?? [], slug);
    if (below.length > 0) return [node, ...below];
  }
  return [];
}

export function findCategory(nodes: CategoryNode[], slug: string): CategoryNode | null {
  return flattenCategories(nodes).find((node) => node.slug === slug) ?? null;
}
