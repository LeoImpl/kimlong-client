import { describe, expect, it } from "vitest";
import { mergeEntries, normalizePartNumber, parseOrderText } from "./quick-order";

describe("parseOrderText", () => {
  it("reads cells copied from Excel, which arrive tab-separated", () => {
    expect(parseOrderText("1613900100\t2\nDSBC-32-50-PPVA-N3\t5")).toEqual([
      { partNumber: "1613900100", quantity: 2 },
      { partNumber: "DSBC-32-50-PPVA-N3", quantity: 5 },
    ]);
  });

  it("reads CSV with a header row, quotes, a BOM and the semicolons Vietnamese Excel writes", () => {
    const csv = '﻿"Mã sản phẩm";"Số lượng"\r\n"1613900100";"1.000"\r\n\r\n2901-0521-00;3\r\n';
    expect(parseOrderText(csv)).toEqual([
      { partNumber: "1613900100", quantity: 1000 },
      { partNumber: "2901-0521-00", quantity: 3 },
    ]);
  });

  it("defaults a missing or unreadable quantity to one", () => {
    expect(parseOrderText("1613900100\n1092100700, vài cái")).toEqual([
      { partNumber: "1613900100", quantity: 1 },
      { partNumber: "1092100700", quantity: 1 },
    ]);
  });

  it("keeps a first row that is data rather than a header", () => {
    expect(parseOrderText("1613900100,4")).toEqual([{ partNumber: "1613900100", quantity: 4 }]);
  });
});

describe("mergeEntries", () => {
  it("adds up the same part number however it was written", () => {
    expect(
      mergeEntries([
        { partNumber: "DSBC-32-50", quantity: 2 },
        { partNumber: "dsbc 32 50", quantity: 3 },
        { partNumber: "1613900100", quantity: 1 },
      ]),
    ).toEqual([
      { partNumber: "DSBC-32-50", quantity: 5 },
      { partNumber: "1613900100", quantity: 1 },
    ]);
  });
});

describe("normalizePartNumber", () => {
  it("ignores case and separators like the API does", () => {
    expect(normalizePartNumber(" dsbc-32/50 ppva ")).toBe("DSBC3250PPVA");
  });
});
