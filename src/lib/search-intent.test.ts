import { describe, expect, it } from "vitest";
import type { CategoryNode } from "./api/types";
import { resolveSearchIntent } from "./search-intent";

const node = (slug: string, name: string, children: CategoryNode[] = []): CategoryNode => ({
  slug,
  name,
  description: null,
  children,
});

const categories = [
  node("phu-tung-may-nen-khi", "Phụ tùng máy nén khí", [
    node("loc-dau", "Lọc dầu"),
    node("loc-gio", "Lọc gió"),
    node("loc-tach-dau", "Lọc tách dầu"),
  ]),
  node("thiet-bi-tu-dong-hoa", "Thiết bị tự động hóa", [node("bien-tan", "Biến tần")]),
];
const brands = [
  { slug: "atlas-copco", name: "Atlas Copco" },
  { slug: "kobelco", name: "Kobelco" },
  { slug: "ingersoll-rand", name: "Ingersoll Rand" },
];

const resolve = (query: string) => resolveSearchIntent(query, categories, brands);

describe("resolveSearchIntent", () => {
  it("sends each filter type to its own category, never to a neighbour", () => {
    expect(resolve("lọc dầu")).toEqual({ category: "loc-dau" });
    expect(resolve("Lọc tách dầu")).toEqual({ category: "loc-tach-dau" });
    expect(resolve("lọc gió")).toEqual({ category: "loc-gio" });
  });

  it("knows the other names buyers use", () => {
    expect(resolve("lọc khí")).toEqual({ category: "loc-gio" });
    expect(resolve("loc tach")).toEqual({ category: "loc-tach-dau" });
    expect(resolve("tách dầu")).toEqual({ category: "loc-tach-dau" });
  });

  it("keeps a brand as a filter, in either order", () => {
    expect(resolve("lọc dầu Atlas Copco")).toEqual({ category: "loc-dau", brand: "atlas-copco" });
    expect(resolve("kobelco lọc tách dầu")).toEqual({ category: "loc-tach-dau", brand: "kobelco" });
    expect(resolve("lọc gió ingersoll-rand chính hãng")).toEqual({
      category: "loc-gio",
      brand: "ingersoll-rand",
    });
  });

  it("ignores filler words", () => {
    expect(resolve("lọc dầu máy nén khí chính hãng")).toEqual({ category: "loc-dau" });
  });

  it("leaves part numbers, models and anything unrecognised to the normal search", () => {
    expect(resolve("1613900100")).toBeNull();
    expect(resolve("lọc dầu 1613610500")).toBeNull();
    expect(resolve("lọc dầu festo")).toBeNull();
    expect(resolve("")).toBeNull();
  });
});
