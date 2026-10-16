/**
 * The arithmetic of a quotation, for instant feedback while the salesperson types. Pure TypeScript with the same
 * rules — and the same test figures — as the platform (`PricingPolicy`, `VatRate`, `Quotation` and
 * `PricingTest.java`): what is stored and printed is always computed by the platform, this only previews it.
 *
 * Amounts are whole dong. Cost and fixed cost are per unit; commission and shipping belong to the whole quotation.
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

/** The customer's commission and the shipping cost of the whole quotation or order. Internal. */
export interface SellingCosts {
  /** Hundredths of a percent of the total before VAT: 300 = 3%. */
  commissionBasisPoints: number;
  shippingCost: number;
}

export const NO_SELLING_COSTS: SellingCosts = { commissionBasisPoints: 0, shippingCost: 0 };

/** 50%, as `SellingCosts.MAX_COMMISSION_BASIS_POINTS` on the platform. */
export const MAX_COMMISSION_BASIS_POINTS = 5000;

/** The commission on `amount`, rounded half up to the dong. */
export function commissionOn(amount: number, basisPoints: number): number {
  return Number((BigInt(amount) * BigInt(basisPoints) + BigInt(5000)) / BigInt(10000));
}

/**
 * The unit price at which a line still leaves the target margin after the customer's commission, rounded up:
 * `lineCost / quantity / (1 − margin − commission)`. `null` when margin and commission take the whole price.
 */
export function suggestLinePrice(
  lineCost: number,
  quantity: number,
  commissionBasisPoints: number,
  targetMarginPercent: number,
  rounding = 1000,
): number | null {
  const kept = 10000 - targetMarginPercent * 100 - commissionBasisPoints;
  if (kept <= 0) return null;
  const divisor = BigInt(kept) * BigInt(quantity);
  const numerator = BigInt(lineCost) * BigInt(10000);
  const exact = (numerator + divisor - BigInt(1)) / divisor;
  const step = BigInt(rounding);
  return Number(((exact + step - BigInt(1)) / step) * step);
}

export interface LineFigures {
  /** The part of the shipping cost carried by the whole line. */
  shippingShare: number;
  commission: number;
  /** `null` while the purchase cost is unknown. */
  suggestedUnitPrice: number | null;
  /** Of the whole line, after costs, shipping share and commission; `null` while the cost is unknown. */
  profit: number | null;
  belowTarget: boolean;
}

export interface PriceAnalysis {
  lines: LineFigures[];
  commission: number;
  /** Revenue before VAT minus costs, shipping and commission; `null` while a line has no cost or there are none. */
  grossProfit: number | null;
}

function lineCostTotal(line: PricedLine): number | null {
  return line.unitCost === null ? null : (line.unitCost + line.fixedCost) * line.quantity;
}

/**
 * Shipping is spread over the lines whose cost is known, in proportion to that cost (by quantity when all those
 * costs are zero); whole dong, the remainder to the line with the largest weight. Same rules as `PriceAnalysis.java`.
 */
function shippingShares(lines: PricedLine[], shipping: number): number[] {
  const shares = lines.map(() => 0);
  if (shipping === 0) return shares;
  let weights = lines.map((line) => lineCostTotal(line) ?? 0);
  let sum = weights.reduce((total, weight) => total + weight, 0);
  if (sum === 0) {
    weights = lines.map((line) => (line.unitCost === null ? 0 : line.quantity));
    sum = weights.reduce((total, weight) => total + weight, 0);
    if (sum === 0) return shares;
  }
  let given = 0;
  let largest = 0;
  weights.forEach((weight, index) => {
    shares[index] = Number((BigInt(shipping) * BigInt(weight)) / BigInt(sum));
    given += shares[index];
    if (weight > weights[largest]) largest = index;
  });
  shares[largest] += shipping - given;
  return shares;
}

/** Per line: shipping share, commission, suggested price, profit; and the totals. Mirrors `PriceAnalysis.java`. */
export function analyse(
  lines: PricedLine[],
  costs: SellingCosts,
  targetMarginPercent: number,
  rounding = 1000,
): PriceAnalysis {
  const shares = shippingShares(lines, costs.shippingCost);
  let commission = 0;
  let profit = 0;
  let known = lines.length > 0;
  const figures = lines.map((line, index): LineFigures => {
    const total = lineTotal(line);
    const lineCommission = commissionOn(total, costs.commissionBasisPoints);
    commission += lineCommission;
    const goods = lineCostTotal(line);
    if (goods === null) {
      known = false;
      return {
        shippingShare: 0,
        commission: lineCommission,
        suggestedUnitPrice: null,
        profit: null,
        belowTarget: false,
      };
    }
    const cost = goods + shares[index];
    const lineProfit = total - cost - lineCommission;
    profit += lineProfit;
    return {
      shippingShare: shares[index],
      commission: lineCommission,
      suggestedUnitPrice: suggestLinePrice(
        cost,
        line.quantity,
        costs.commissionBasisPoints,
        targetMarginPercent,
        rounding,
      ),
      profit: lineProfit,
      belowTarget: lineProfit * 100 < total * targetMarginPercent,
    };
  });
  return { lines: figures, commission, grossProfit: known ? profit : null };
}

/** A percentage typed with a comma or a dot, as basis points; `null` when empty, `NaN` when not a number. */
export function parsePercent(value: string): number | null {
  const cleaned = value.trim().replace(",", ".");
  if (!cleaned) return null;
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(cleaned)) return Number.NaN;
  return Math.round(Number(cleaned) * 100);
}

/** Commission and shipping as typed in the form; an unreadable or too high percentage counts as none. */
export function typedSellingCosts(form: { commissionPercent: string; shippingCost: string }): {
  costs: SellingCosts;
  commissionInvalid: boolean;
} {
  const basisPoints = parsePercent(form.commissionPercent);
  const commissionInvalid =
    basisPoints !== null &&
    (Number.isNaN(basisPoints) || basisPoints > MAX_COMMISSION_BASIS_POINTS);
  return {
    costs: {
      commissionBasisPoints: basisPoints === null || commissionInvalid ? 0 : basisPoints,
      shippingCost: parseAmount(form.shippingCost) ?? 0,
    },
    commissionInvalid,
  };
}

/** Basis points as the percentage the API expects (300 → 3). */
export function basisPointsToPercent(basisPoints: number): number {
  return basisPoints / 100;
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
