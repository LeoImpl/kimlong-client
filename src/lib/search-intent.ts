import type { CategoryNode } from "./api/types";

/**
 * Turns a search that names a product type into that category. Full text search matches words, not phrases, so
 * "lọc dầu" also finds every "lọc tách dầu"; a buyer who typed a type name wants exactly that type, so the
 * search page sends them to the category (with the brand filter when they named one) instead of a mixed list.
 *
 * Only a query made of a category name plus, optionally, a brand and filler words ("chính hãng", "máy nén khí")
 * is resolved. Anything else — a part number, a model, extra words — stays a normal search.
 */

/** Other names buyers use for a type, keyed by category slug. Category names themselves always count. */
const CATEGORY_ALIASES: Record<string, string[]> = {
  "loc-dau": ["loc nhot", "oil filter"],
  "loc-gio": ["loc khi", "air filter"],
  "loc-tach-dau": ["loc tach", "tach dau", "loc tach nhot", "oil separator", "separator"],
};

/** Words that add nothing to the type: "lọc dầu chính hãng cho máy nén khí" is still "lọc dầu". */
const FILLER = ["chinh hang", "may nen khi", "cho", "cua", "hang", "gia"];

export interface SearchIntent {
  category: string;
  brand?: string;
}

export function normalizeQuery(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function resolveSearchIntent(
  query: string,
  categories: CategoryNode[],
  brands: { slug: string; name: string }[],
): SearchIntent | null {
  const text = normalizeQuery(query);
  if (!text) return null;

  // Longest phrase first, so "loc tach dau" is never read as "loc ... dau".
  const phrases = flatten(categories)
    .flatMap((category) =>
      [normalizeQuery(category.name), ...(CATEGORY_ALIASES[category.slug] ?? [])].map((phrase) => ({
        phrase,
        slug: category.slug,
      })),
    )
    .sort((a, b) => b.phrase.length - a.phrase.length);

  for (const { phrase, slug } of phrases) {
    const rest = removeWords(text, phrase);
    if (rest === null) continue;
    const remaining = FILLER.reduce((left, filler) => removeWords(left, filler) ?? left, rest);
    if (!remaining) return { category: slug };
    const brand = brands.find(
      (candidate) =>
        normalizeQuery(candidate.name) === remaining ||
        normalizeQuery(candidate.slug) === remaining,
    );
    return brand ? { category: slug, brand: brand.slug } : null;
  }
  return null;
}

/** [text] with the whole-word [phrase] taken out, or null when the phrase is not in it. */
function removeWords(text: string, phrase: string): string | null {
  const padded = ` ${text} `;
  const index = padded.indexOf(` ${phrase} `);
  if (index < 0) return null;
  return (padded.slice(0, index) + " " + padded.slice(index + phrase.length + 2))
    .replace(/\s+/g, " ")
    .trim();
}

function flatten(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children ?? [])]);
}
