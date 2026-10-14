import { describe, expect, it } from "vitest";
import { isSpreadsheetPaste, parsePastedLines } from "./paste";

describe("pasting rows from Excel into the quotation grid", () => {
  it("reads the grid's columns: part number, name, unit, quantity, unit price", () => {
    const text =
      "Mã hàng\tTên hàng\tĐVT\tSL\tĐơn giá\r\n" +
      "1613900100\tLọc gió Atlas Copco\tcái\t3\t1.250.000\r\n" +
      '"DSBC-32-50"\tXi lanh  Festo\tbộ\t2\t4.100.500 ₫\r\n' +
      "\r\n";
    expect(parsePastedLines(text)).toEqual([
      {
        partNumber: "1613900100",
        name: "Lọc gió Atlas Copco",
        unit: "cái",
        quantity: 3,
        unitPrice: 1250000,
      },
      {
        partNumber: "DSBC-32-50",
        name: "Xi lanh Festo",
        unit: "bộ",
        quantity: 2,
        unitPrice: 4100500,
      },
    ]);
  });

  it("takes one column as part numbers and two as part numbers with quantities", () => {
    expect(parsePastedLines("1613900100\nIE5379\n")).toEqual([
      { partNumber: "1613900100", name: "", unit: "", quantity: null, unitPrice: null },
      { partNumber: "IE5379", name: "", unit: "", quantity: null, unitPrice: null },
    ]);
    expect(parsePastedLines("Mã\tSố lượng\n1613900100\t12\nIE5379\t1.000")).toEqual([
      { partNumber: "1613900100", name: "", unit: "", quantity: 12, unitPrice: null },
      { partNumber: "IE5379", name: "", unit: "", quantity: 1000, unitPrice: null },
    ]);
  });

  it("keeps rows without a part number and leaves unreadable numbers empty", () => {
    expect(parsePastedLines("\tCông lắp đặt\tgói\tmột\t")).toEqual([
      { partNumber: "", name: "Công lắp đặt", unit: "gói", quantity: null, unitPrice: null },
    ]);
  });

  it("caps a huge paste at the quotation's line limit", () => {
    const text = Array.from({ length: 500 }, (_, index) => `PN-${index}`).join("\n");
    expect(parsePastedLines(text)).toHaveLength(200);
  });

  it("tells a block of cells from a single typed value", () => {
    expect(isSpreadsheetPaste("1613900100")).toBe(false);
    expect(isSpreadsheetPaste("1613900100\n")).toBe(false);
    expect(isSpreadsheetPaste("1613900100\t3")).toBe(true);
    expect(isSpreadsheetPaste("1613900100\nIE5379")).toBe(true);
  });
});
