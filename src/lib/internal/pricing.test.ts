import { describe, expect, it } from "vitest";
import {
  belowTarget,
  lineTotal,
  marginPercent,
  parseAmount,
  percentOf,
  subtotal,
  suggestPrice,
  totalProfit,
  unitProfit,
  vatAmount,
} from "./pricing";

/** The figures here are shared with the platform's PricingTest.java: keep both in sync. */
describe("suggested price", () => {
  it.each([
    [700000, 0, 1000000],
    [650000, 50000, 1000000],
    [700001, 0, 1001000],
    [1234567, 89000, 1891000],
    [0, 0, 0],
    [1, 0, 1000],
    [85000000, 1500000, 123572000],
  ])("cost %i + fixed %i is suggested at %i", (unitCost, fixedCost, expected) => {
    expect(suggestPrice(unitCost, fixedCost, 30)).toBe(expected);
  });

  it("is a margin on the price, not a markup on the cost", () => {
    expect(suggestPrice(800000, 0, 20)).toBe(1000000);
    const atTarget = { quantity: 1, unitPrice: 1000000, unitCost: 700000, fixedCost: 0 };
    expect(belowTarget(atTarget, 30)).toBe(false);
    expect(belowTarget({ ...atTarget, unitPrice: 999000 }, 30)).toBe(true);
    // A 30% markup would have given 910.000 — which is below a 30% margin.
    expect(belowTarget({ ...atTarget, unitPrice: 910000 }, 30)).toBe(true);
  });
});

describe("VAT", () => {
  it.each([
    [1000000, 10, 100000],
    [1000000, 8, 80000],
    [1000000, 5, 50000],
    [1000000, 0, 0],
    [1000000, null, 0],
    [12345, 10, 1235],
    [12344, 10, 1234],
    [33, 8, 3],
    [19, 8, 2],
    [6, 8, 0],
    [7, 8, 1],
  ])("%i at %s%% is %i", (net, percent, expected) => {
    expect(vatAmount(net, percent)).toBe(expected);
  });
});

describe("totals and margins", () => {
  const filter = { quantity: 3, unitPrice: 1250000, unitCost: 800000, fixedCost: 0 };
  const sensor = { quantity: 2, unitPrice: 4100500, unitCost: null, fixedCost: 0 };

  it("adds up the lines like the platform does", () => {
    expect(lineTotal(filter)).toBe(3750000);
    const net = subtotal([filter, sensor]);
    expect(net).toBe(11951000);
    expect(vatAmount(net, 10)).toBe(1195100);
    expect(net + vatAmount(net, 10)).toBe(13146100);
  });

  it("knows a profit only when the purchase cost is known", () => {
    expect(unitProfit(filter)).toBe(450000);
    expect(marginPercent(filter)).toBe(36);
    expect(unitProfit(sensor)).toBeNull();
    expect(marginPercent(sensor)).toBeNull();
    expect(totalProfit([filter])).toBe(1350000);
    expect(totalProfit([filter, sensor])).toBeNull();
    expect(totalProfit([])).toBeNull();
    expect(belowTarget(sensor, 30)).toBe(false);
  });

  it("includes the fixed cost and shows a loss as a negative margin", () => {
    const line = { quantity: 1, unitPrice: 1000000, unitCost: 650000, fixedCost: 50000 };
    expect(unitProfit(line)).toBe(300000);
    expect(marginPercent(line)).toBe(30);
    expect(marginPercent({ ...line, unitPrice: 500000 })).toBe(-40);
    expect(marginPercent({ ...line, unitPrice: 0 })).toBeNull();
    expect(percentOf(600000, 2700000)).toBe(22.2);
    expect(percentOf(null, 100)).toBeNull();
  });

  it("reads amounts typed with grouping separators", () => {
    expect(parseAmount("1.250.000")).toBe(1250000);
    expect(parseAmount("1,250,000 ₫")).toBe(1250000);
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
  });
});
