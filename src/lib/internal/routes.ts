/** URLs of the internal area, in Vietnamese like the rest of the site (decision Q11: everything under /noi-bo). */
export const internalRoutes = {
  dashboard: "/noi-bo",
  customers: "/noi-bo/khach-hang",
  newCustomer: "/noi-bo/khach-hang/tao",
  customer: (id: string) => `/noi-bo/khach-hang/${encodeURIComponent(id)}`,
  quotations: "/noi-bo/bao-gia",
  newQuotation: "/noi-bo/bao-gia/tao",
  newQuotationFor: (customerId: string) =>
    `/noi-bo/bao-gia/tao?khach=${encodeURIComponent(customerId)}`,
  quotation: (id: string) => `/noi-bo/bao-gia/${encodeURIComponent(id)}`,
  quotationFile: (id: string, documentId: string) =>
    `/noi-bo/bao-gia/${encodeURIComponent(id)}/file/${encodeURIComponent(documentId)}`,
  quotedPrices: "/noi-bo/gia-da-chao",
  quotedPricesFor: (partNumber: string) =>
    `/noi-bo/gia-da-chao?ma=${encodeURIComponent(partNumber)}`,
  orders: "/noi-bo/don-hang",
  order: (id: string) => `/noi-bo/don-hang/${encodeURIComponent(id)}`,
  webRequests: "/noi-bo/yeu-cau-web",
  webRequest: (id: string) => `/noi-bo/yeu-cau-web/${encodeURIComponent(id)}`,
} as const;

/** The first value of a query parameter, trimmed; `undefined` when absent or blank. */
export function param(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  const trimmed = first?.trim();
  return trimmed ? trimmed : undefined;
}

/** A zero-based page from the one-based `trang` parameter people see in the address bar. */
export function pageParam(value: string | string[] | undefined): number {
  const parsed = Number.parseInt(param(value) ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 1 ? parsed - 1 : 0;
}

/** Rebuilds the current URL with other query values; empty values are dropped. Used by filters and paging. */
export function withQuery(
  path: string,
  current: Record<string, string | undefined>,
  changes: Record<string, string | number | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...changes })) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}
