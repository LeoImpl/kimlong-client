import { cacheLife, cacheTag } from "next/cache";
import { apiFetch, apiFetchOrNull } from "./client";
import type { Article, ArticlePage } from "./types";

/**
 * Article reads. Articles change when staff edit them, which is rarely, and every input here is a closed set (a
 * page number, a slug that exists), so everything is cached like the catalogue.
 */

const TAGS = {
  list: "content:articles",
  article: (slug: string) => `content:article:${slug}`,
} as const;

export const ARTICLES_PAGE_SIZE = 12;

export async function listArticles(page = 0, size = ARTICLES_PAGE_SIZE): Promise<ArticlePage> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.list);
  return apiFetch<ArticlePage>("/api/public/v1/articles", { query: { page, size } });
}

/** The articles that link a product, for its product page. */
export async function listArticlesForProduct(productSlug: string): Promise<ArticlePage> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.list);
  return apiFetch<ArticlePage>("/api/public/v1/articles", {
    query: { product: productSlug, size: 6 },
  });
}

export async function getArticle(slug: string): Promise<Article | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.article(slug));
  return apiFetchOrNull<Article>(`/api/public/v1/articles/${encodeURIComponent(slug)}`);
}
