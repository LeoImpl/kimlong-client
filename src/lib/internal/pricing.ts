/**
 * The arithmetic of a quotation, for instant feedback while the salesperson types. Pure TypeScript with the same
 * rules — and the same test figures — as the platform (`PricingPolicy`, `VatRate`, `Quotation` and
 * `PricingTest.java`): what is stored and printed is always computed by the platform, this only previews it.
 *
 * Amounts are whole dong. Cost and fixed cost are per unit.
 */

export interface PricedLine {
  quantity: number;
  /** Price offered to the customer, per unit, before VAT. */
  unitPrice: number;
  /** What one unit costs to buy; `null` while unknown. */
  unitCost: number | null;
  /** Other cost carried by one unit; zero when not given. */
  fixedCost: number;
}

export function lineTotal(line: Pick<PricedLine, "quantity" | "unitPrice">): number {
  return line.quantity * line.unitPrice;
}

export function subtotal(lines: Pick<PricedLine, "quantity" | "unitPrice">[]): number {
  return lines.reduce((sum, line) => sum + lineTotal(line), 0);
}

/** VAT on `net`, rounded half up to the dong. `percent` is `null` when the quotation is not subject to VAT. */
export function vatAmount(net: number, percent: number | null): number {
  if (!percent) return 0;
  return Math.floor((net * percent + 50) / 100);
}

/**
 * The price at which the unit costs leave the target margin *on the selling price* — not a markup on the cost:
 * with 30%, a unit costing 700.000 is suggested at 1.000.000 (700.000 / 0,7). Rounded up to `rounding` dong.
 */
export function suggestPrice(
  unitCost: number,
  fixedCost: number,
  targetMarginPercent: number,
  rounding = 1000,
): number {
  const cost = unitCost + fixedCost;
  const exact = Math.ceil((cost * 100) / (100 - targetMarginPercent));
  return Math.ceil(exact / rounding) * rounding;
}

/** Profit on one unit; negative when sold below cost. `null` while the purchase cost is unknown. */
export function unitProfit(line: PricedLine): number | null {
  return line.unitCost === null ? null : line.unitPrice - line.unitCost - line.fixedCost;
}

/** Profit as a percentage of the selling price, one decimal; `null` when unknown or the price is zero. */
export function marginPercent(line: PricedLine): number | null {
  const profit = unitProfit(line);
  if (profit === null || line.unitPrice === 0) return null;
  return Math.round((profit * 1000) / line.unitPrice) / 10;
}

/** True when the price leaves less than the target margin. Flagged, never blocked. */
export function belowTarget(line: PricedLine, targetMarginPercent: number): boolean {
  const profit = unitProfit(line);
  return profit !== null && profit * 100 < line.unitPrice * targetMarginPercent;
}

/** Profit over all lines, or `null` while any line has no purchase cost (or there are no lines). */
export function totalProfit(lines: PricedLine[]): number | null {
  if (lines.length === 0) return null;
  let sum = 0;
  for (const line of lines) {
    const profit = unitProfit(line);
    if (profit === null) return null;
    sum += profit * line.quantity;
  }
  return sum;
}

/** `part` as a percentage of `whole` with one decimal; `null` when either is unknown or zero. */
export function percentOf(part: number | null, whole: number): number | null {
  if (part === null || whole === 0) return null;
  return Math.round((part * 1000) / whole) / 10;
}

/** Digits typed into an amount field as a whole number; `null` when the field is empty. */
export function parseAmount(value: string): number | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  const parsed = Number(digits);
  return Number.isSafeInteger(parsed) ? parsed : null;
}
