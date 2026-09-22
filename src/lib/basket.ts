/**
 * The quote basket.
 *
 * It lives in `localStorage` and nowhere else: v1 has no login, so there is no server to keep it on, and a
 * buyer collecting eight part numbers across two days would lose the lot if it were only in memory. The storage
 * format is versioned so a later change can drop old baskets instead of crashing on them.
 */

export interface BasketLine {
  /**
   * Null for a part number the catalogue does not list (typed or uploaded on the quick order page). Such a line
   * still goes to sales: the API resolves part numbers itself, and an unlisted part is often one we can source.
   */
  productSlug: string | null;
  productName: string;
  /** A product may be added as a whole family (null) or as one specific part number. */
  partNumber: string | null;
  quantity: number;
  unit: string;
  imageUrl: string | null;
}

export const DEFAULT_UNIT = "cái";

/** The API accepts up to 100 lines per request; stopping earlier keeps the review page usable. */
export const MAX_LINES = 50;
export const MAX_QUANTITY = 9999;

export const STORAGE_KEY = "kimlong.quote-basket.v1";

/** A line is identified by product and part number, so the same product can be asked for in two sizes. */
export function lineId(line: Pick<BasketLine, "productSlug" | "partNumber">): string {
  return `${line.productSlug ?? ""}::${line.partNumber ?? ""}`;
}

export function addLine(lines: BasketLine[], line: BasketLine): BasketLine[] {
  const id = lineId(line);
  const existing = lines.find((candidate) => lineId(candidate) === id);
  if (existing) {
    return lines.map((candidate) =>
      lineId(candidate) === id
        ? { ...candidate, quantity: clampQuantity(candidate.quantity + line.quantity) }
        : candidate,
    );
  }
  if (lines.length >= MAX_LINES) return lines;
  return [...lines, { ...line, quantity: clampQuantity(line.quantity) }];
}

export function updateLine(
  lines: BasketLine[],
  id: string,
  changes: Partial<BasketLine>,
): BasketLine[] {
  return lines.map((line) =>
    lineId(line) === id
      ? {
          ...line,
          ...changes,
          quantity: clampQuantity(changes.quantity ?? line.quantity),
        }
      : line,
  );
}

export function removeLine(lines: BasketLine[], id: string): BasketLine[] {
  return lines.filter((line) => lineId(line) !== id);
}

export function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_QUANTITY, Math.max(1, Math.round(quantity)));
}

/**
 * Reads what is in storage, dropping anything that does not look like a basket line. Storage is shared with the
 * browser's other tabs and survives releases, so it is treated as untrusted input rather than as our own data.
 */
export function parseBasket(raw: string | null): BasketLine[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isBasketLine)
      .map((line) => ({ ...line, quantity: clampQuantity(line.quantity) }));
  } catch {
    return [];
  }
}

function isBasketLine(value: unknown): value is BasketLine {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Record<string, unknown>;
  const slug = line.productSlug;
  const partNumber = line.partNumber;
  return (
    (slug === null || (typeof slug === "string" && slug.length > 0)) &&
    typeof line.productName === "string" &&
    (partNumber === null || typeof partNumber === "string") &&
    // A line needs something sales can act on: a product, or at least a part number.
    (slug !== null || (typeof partNumber === "string" && partNumber.length > 0)) &&
    typeof line.quantity === "number" &&
    typeof line.unit === "string" &&
    (line.imageUrl === null || typeof line.imageUrl === "string")
  );
}

export function totalQuantity(lines: BasketLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}
