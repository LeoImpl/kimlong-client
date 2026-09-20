/**
 * Every URL in one place, in Vietnamese (decision D6). Slugs from the API are already ASCII and diacritic-free,
 * so they need no escaping beyond `encodeURIComponent` for safety.
 */
export const routes = {
  home: "/",
  about: "/gioi-thieu",
  contact: "/lien-he",
  quote: "/yeu-cau-bao-gia",
  quoteSent: "/yeu-cau-bao-gia/da-gui",
  products: "/san-pham",
  product: (slug: string) => `/san-pham/${encodeURIComponent(slug)}`,
  categories: "/danh-muc",
  category: (slug: string) => `/danh-muc/${encodeURIComponent(slug)}`,
  brands: "/thuong-hieu",
  brand: (slug: string) => `/thuong-hieu/${encodeURIComponent(slug)}`,
  search: (q: string) => `/san-pham?q=${encodeURIComponent(q)}`,
} as const;
