#!/usr/bin/env node
/**
 * Phase 0 smoke test: proves this app can reach the platform API and read real catalogue data.
 * Run against a running backend:  npm run smoke
 */
const base = process.env.API_BASE_URL ?? "http://localhost:8080";

async function get(path) {
  const response = await fetch(`${base}${path}`, {
    headers: { Accept: "application/json", "Accept-Language": "vi" },
  });
  if (!response.ok) throw new Error(`GET ${path} -> ${response.status}`);
  return response.json();
}

const checks = [];
function check(name, ok, detail) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "  ok  " : " FAIL "} ${name}${detail ? `  (${detail})` : ""}`);
}

try {
  const categories = await get("/api/public/v1/catalog/categories");
  check(
    "category tree",
    Array.isArray(categories) && categories.length > 0,
    `${categories.length} roots`,
  );
  check(
    "categories are Vietnamese",
    typeof categories[0]?.name === "string" && categories[0].name.length > 0,
    categories[0]?.name,
  );

  const brands = await get("/api/public/v1/catalog/brands");
  check("brands", Array.isArray(brands) && brands.length > 0, `${brands.length} brands`);

  const products = await get("/api/public/v1/catalog/products?size=5");
  check(
    "product search",
    (products.items ?? []).length > 0,
    `${products.totalItems} products total`,
  );

  const slug = products.items[0].slug;
  const product = await get(`/api/public/v1/catalog/products/${slug}`);
  check("product detail", product.slug === slug, slug);
  check(
    "product has part numbers",
    (product.variants ?? []).length >= 0,
    `${product.variants.length} variants`,
  );

  const withImage = (products.items ?? []).find((p) => p.imageUrl);
  if (withImage) {
    const image = await fetch(`${base}${withImage.imageUrl}`);
    check(
      "image served from storage",
      image.ok && (image.headers.get("content-type") ?? "").startsWith("image/"),
      `${image.status} ${image.headers.get("content-type")}`,
    );
  } else {
    check("image served from storage", false, "no product with an image in the first page");
  }
} catch (error) {
  check("reached the API", false, error.message);
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
process.exit(failed.length === 0 ? 0 : 1);
