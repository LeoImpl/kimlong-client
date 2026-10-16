import { describe, expect, it } from "vitest";
import {
  analyse,
  commissionOn,
  lineTotal,
  NO_SELLING_COSTS,
  parseAmount,
  parsePercent,
  percentOf,
  subtotal,
  suggestLinePrice,
  suggestPrice,
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
    const below = (unitPrice: number) =>
      analyse([{ quantity: 1, unitPrice, unitCost: 700000, fixedCost: 0 }], NO_SELLING_COSTS, 30)
        .lines[0].belowTarget;
    expect(below(1000000)).toBe(false);
    expect(below(999000)).toBe(true);
    // A 30% markup would have given 910.000 — which is below a 30% margin.
    expect(below(910000)).toBe(true);
  });

  it.each([
    [670000, 1, 300, 1000000],
    [700000, 1, 0, 1000000],
    [675001, 2, 300, 504000],
    [225000, 1, 300, 336000],
    [100000, 1, 7000, null],
  ])(
    "line cost %i for %i units with %i bp commission is suggested at %s per unit",
    (lineCost, quantity, basisPoints, expected) => {
      expect(suggestLinePrice(lineCost, quantity, basisPoints, 30)).toBe(expected);
    },
  );
});

describe("commission and shipping", () => {
  it("takes the commission as a share of each line total before VAT", () => {
    // The owner's example: 3% on 2 × 50.000 and 1 × 20.000 is 3.000 + 600.
    const analysis = analyse(
      [
        { quantity: 2, unitPrice: 50000, unitCost: 30000, fixedCost: 0 },
        { quantity: 1, unitPrice: 20000, unitCost: 12000, fixedCost: 0 },
      ],
      { commissionBasisPoints: 300, shippingCost: 0 },
      30,
    );
    expect(analysis.lines.map((line) => line.commission)).toEqual([3000, 600]);
    expect(analysis.commission).toBe(3600);
    expect(analysis.grossProfit).toBe(120000 - 72000 - 3600);
    expect(commissionOn(50, 300)).toBe(2);
  });

  it("spreads shipping by line cost and suggests prices that cover it", () => {
    const analysis = analyse(
      [
        { quantity: 2, unitPrice: 504000, unitCost: 300000, fixedCost: 0 },
        { quantity: 1, unitPrice: 336000, unitCost: 200000, fixedCost: 0 },
      ],
      { commissionBasisPoints: 300, shippingCost: 100001 },
      30,
    );
    expect(analysis.lines.map((line) => line.shippingShare)).toEqual([75001, 25000]);
    expect(analysis.lines.map((line) => line.suggestedUnitPrice)).toEqual([504000, 336000]);
    expect(analysis.lines.map((line) => line.profit)).toEqual([302759, 100920]);
    expect(analysis.lines.some((line) => line.belowTarget)).toBe(false);
    expect(analysis.grossProfit).toBe(403679);
  });

  it("gives no shipping to lines without a cost and leaves the profit open", () => {
    const analysis = analyse(
      [
        { quantity: 1, unitPrice: 100000, unitCost: 0, fixedCost: 0 },
        { quantity: 3, unitPrice: 10000, unitCost: null, fixedCost: 0 },
      ],
      { commissionBasisPoints: 0, shippingCost: 50000 },
      30,
    );
    expect(analysis.lines.map((line) => line.shippingShare)).toEqual([50000, 0]);
    expect(analysis.lines[1].suggestedUnitPrice).toBeNull();
    expect(analysis.grossProfit).toBeNull();
  });

  it("reads a percentage typed with a comma", () => {
    expect(parsePercent("3")).toBe(300);
    expect(parsePercent("2,5")).toBe(250);
    expect(parsePercent(" 2.75 ")).toBe(275);
    expect(parsePercent("")).toBeNull();
    expect(parsePercent("abc")).toBeNaN();
    expect(parsePercent("2,555")).toBeNaN();
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
    const analysis = analyse([filter, sensor], NO_SELLING_COSTS, 30);
    expect(analysis.lines[0].profit).toBe(1350000);
    expect(analysis.lines[1].profit).toBeNull();
    expect(analysis.lines[1].belowTarget).toBe(false);
    expect(analysis.grossProfit).toBeNull();
    expect(analyse([filter], NO_SELLING_COSTS, 30).grossProfit).toBe(1350000);
    expect(analyse([], NO_SELLING_COSTS, 30).grossProfit).toBeNull();
  });

  it("includes the fixed cost and shows a loss as a negative margin", () => {
    const line = { quantity: 1, unitPrice: 1000000, unitCost: 650000, fixedCost: 50000 };
    const profit = (unitPrice: number) =>
      analyse([{ ...line, unitPrice }], NO_SELLING_COSTS, 30).lines[0].profit;
    expect(profit(1000000)).toBe(300000);
    expect(percentOf(profit(500000), 500000)).toBe(-40);
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
