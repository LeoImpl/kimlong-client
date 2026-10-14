/**
 * Rows pasted into the quotation grid from a spreadsheet.
 *
 * Copying cells in Excel puts tab-separated rows on the clipboard. Columns are read in the grid's own order —
 * mã hàng, tên hàng, ĐVT, số lượng, đơn giá — with two shortcuts for the lists people actually keep: a single
 * column is part numbers, and two columns whose second is a number are part numbers with quantities.
 */

export interface PastedLine {
  partNumber: string;
  name: string;
  unit: string;
  quantity: number | null;
  unitPrice: number | null;
}

export const MAX_PASTED_LINES = 200;

/** True when the clipboard holds a block of cells rather than a single value. */
export function isSpreadsheetPaste(text: string): boolean {
  return /[\t\n]/.test(text.replace(/[\r\n]+$/, ""));
}

export function parsePastedLines(text: string): PastedLine[] {
  const rows = text
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .map((row) => row.split("\t").map(clean))
    .filter((cells) => cells.some((cell) => cell.length > 0));
  if (rows.length === 0) return [];

  const width = Math.max(...rows.map((cells) => cells.length));
  // A single row is always data: nobody pastes a header alone.
  const body = rows.length > 1 && isHeader(rows[0], width) ? rows.slice(1) : rows;
  return body.slice(0, MAX_PASTED_LINES).map((cells) => toLine(cells, width));
}

function toLine(cells: string[], width: number): PastedLine {
  const [first = "", second = "", third = "", fourth = "", fifth = ""] = cells;
  if (width <= 2) {
    // "mã hàng" alone, or "mã hàng, số lượng".
    return { partNumber: first, name: "", unit: "", quantity: number(second), unitPrice: null };
  }
  return {
    partNumber: first,
    name: second,
    unit: third,
    quantity: number(fourth),
    unitPrice: number(fifth),
  };
}

/** A first row is a header when the cell that should hold the quantity holds words instead. */
function isHeader(cells: string[], width: number): boolean {
  if (width === 1) return /^(mã|ma|part|code)/i.test(cells[0] ?? "") && !/\d/.test(cells[0] ?? "");
  const quantity = cells[width <= 2 ? 1 : 3] ?? "";
  return quantity !== "" && !/\d/.test(quantity);
}

function clean(cell: string): string {
  return cell
    .trim()
    .replace(/^"([\s\S]*)"$/, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** Vietnamese spreadsheets group thousands with dots ("1.250.000"); amounts and quantities are whole numbers. */
function number(value: string): number | null {
  const digits = value.replace(/[.,\s₫đ]/gi, "");
  if (!/^\d+$/.test(digits)) return null;
  const parsed = Number(digits);
  return Number.isSafeInteger(parsed) ? parsed : null;
}
