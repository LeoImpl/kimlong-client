import { clampQuantity } from "./basket";

/**
 * Quick order input: a list of part numbers and quantities, typed, pasted from Excel or uploaded as CSV.
 *
 * Buyers keep these lists in spreadsheets, so the parser accepts what a spreadsheet produces: tab-separated rows
 * when cells are copied, comma- or semicolon-separated rows from "Save as CSV" (Vietnamese Excel uses `;`), an
 * optional header row, quoted cells and blank lines.
 */

export interface OrderEntry {
  partNumber: string;
  quantity: number;
}

/** Part numbers are compared the way the API compares them: case and separators do not count. */
export function normalizePartNumber(value: string): string {
  return value.toUpperCase().replace(/[^0-9A-Z]/g, "");
}

const MAX_PART_NUMBER_LENGTH = 64;

export function parseOrderText(text: string): OrderEntry[] {
  const rows = text
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .map((row) => splitRow(row).map(unquote))
    .filter((cells) => cells.some((cell) => cell.length > 0));

  const entries: OrderEntry[] = [];
  rows.forEach((cells, index) => {
    const [partNumber = "", quantity = ""] = cells;
    if (index === 0 && isHeader(partNumber, quantity)) return;
    if (!partNumber || partNumber.length > MAX_PART_NUMBER_LENGTH) return;
    entries.push({ partNumber, quantity: parseQuantity(quantity) });
  });
  return entries;
}

/** One delimiter per row, picked by what the row contains, so "1.5 kW" in a cell never splits it. */
function splitRow(row: string): string[] {
  const delimiter = row.includes("\t")
    ? "\t"
    : row.includes(";")
      ? ";"
      : row.includes(",")
        ? ","
        : null;
  return delimiter ? row.split(delimiter) : [row];
}

function unquote(cell: string): string {
  return cell
    .trim()
    .replace(/^"(.*)"$/, "$1")
    .trim();
}

function isHeader(first: string, second: string): boolean {
  return !/\d/.test(first) || (second !== "" && !/\d/.test(second));
}

/** Vietnamese spreadsheets group thousands with dots ("1.000"); a quantity is always a whole number. */
function parseQuantity(value: string): number {
  const digits = value.replace(/[.,\s]/g, "");
  if (!/^\d+$/.test(digits)) return 1;
  return clampQuantity(Number(digits));
}

/** Adds up repeated part numbers, keeping the first spelling and the original order. */
export function mergeEntries(entries: OrderEntry[]): OrderEntry[] {
  const merged = new Map<string, OrderEntry>();
  for (const entry of entries) {
    const key = normalizePartNumber(entry.partNumber);
    if (!key) continue;
    const existing = merged.get(key);
    merged.set(
      key,
      existing
        ? { ...existing, quantity: clampQuantity(existing.quantity + entry.quantity) }
        : { ...entry },
    );
  }
  return [...merged.values()];
}

/** The file offered as "tải file mẫu": what the parser reads best, and what Excel opens with Vietnamese intact. */
export const CSV_TEMPLATE = "﻿Mã sản phẩm,Số lượng\n1613900100,2\nDSBC-32-50-PPVA-N3,5\n";
