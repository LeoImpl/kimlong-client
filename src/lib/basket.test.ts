import { describe, expect, it } from "vitest";
import {
  MAX_LINES,
  addLine,
  clampQuantity,
  lineId,
  parseBasket,
  removeLine,
  updateLine,
  type BasketLine,
} from "./basket";

function line(overrides: Partial<BasketLine> = {}): BasketLine {
  return {
    productSlug: "loc-gio-atlas-copco",
    productName: "Lọc gió Atlas Copco chính hãng",
    partNumber: "1613900100",
    quantity: 1,
    unit: "cái",
    imageUrl: null,
    ...overrides,
  };
}

describe("addLine", () => {
  it("adds up quantities of the same part number instead of repeating it", () => {
    const lines = addLine(addLine([], line({ quantity: 2 })), line({ quantity: 3 }));
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(5);
  });

  it("keeps the same product as separate lines when the part numbers differ", () => {
    const lines = addLine(addLine([], line()), line({ partNumber: "1613872000" }));
    expect(lines.map((l) => l.partNumber)).toEqual(["1613900100", "1613872000"]);
  });

  it("stops at the maximum rather than growing a list nobody can review", () => {
    const full = Array.from({ length: MAX_LINES }, (_, index) =>
      line({ partNumber: `PN-${index}` }),
    );
    expect(addLine(full, line({ partNumber: "one-too-many" }))).toHaveLength(MAX_LINES);
  });
});

describe("updateLine and removeLine", () => {
  it("changes only the addressed line", () => {
    const lines = [line(), line({ partNumber: "1613872000" })];
    const updated = updateLine(lines, lineId(lines[0]), { quantity: 7 });
    expect(updated[0].quantity).toBe(7);
    expect(updated[1].quantity).toBe(1);
  });

  it("removes by product and part number together", () => {
    const lines = [line(), line({ partNumber: "1613872000" })];
    expect(removeLine(lines, lineId(lines[1])).map((l) => l.partNumber)).toEqual(["1613900100"]);
  });
});

describe("clampQuantity", () => {
  it("never lets a line reach zero, a fraction or NaN", () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(-4)).toBe(1);
    expect(clampQuantity(2.6)).toBe(3);
    expect(clampQuantity(Number.NaN)).toBe(1);
  });
});

describe("parseBasket", () => {
  it("reads back what was stored", () => {
    const stored = JSON.stringify([line({ quantity: 4 })]);
    expect(parseBasket(stored)).toEqual([line({ quantity: 4 })]);
  });

  it("treats storage as untrusted: other tabs, old releases and hand-edited values", () => {
    expect(parseBasket(null)).toEqual([]);
    expect(parseBasket("not json")).toEqual([]);
    expect(parseBasket('{"lines":[]}')).toEqual([]);
    expect(parseBasket('[{"productSlug":"x"}]')).toEqual([]);
  });

  it("keeps a part number the catalogue does not list, but not a line with nothing to quote", () => {
    const unlisted = line({ productSlug: null, productName: "XYZ-1", partNumber: "XYZ-1" });
    expect(parseBasket(JSON.stringify([unlisted]))).toEqual([unlisted]);
    const empty = line({ productSlug: null, partNumber: null });
    expect(parseBasket(JSON.stringify([empty]))).toEqual([]);
  });

  it("repairs a quantity that would be rejected by the API", () => {
    const stored = JSON.stringify([line({ quantity: 0 })]);
    expect(parseBasket(stored)[0].quantity).toBe(1);
  });
});
