"use client";

import { useRef } from "react";
import { Plus, Trash2, TriangleAlert, Wand2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatNumber, formatPercent } from "@/lib/internal/format";
import { isSpreadsheetPaste, parsePastedLines } from "@/lib/internal/paste";
import {
  belowTarget,
  lineTotal,
  marginPercent,
  parseAmount,
  suggestPrice,
  type PricedLine,
} from "@/lib/internal/pricing";
import type { QuotationLine, QuotationLineInput } from "@/lib/internal/types";

/** A row of the grid as it is being typed: every cell is text until it is read. */
export interface GridLine {
  key: number;
  partNumber: string;
  name: string;
  unit: string;
  quantity: string;
  unitCost: string;
  fixedCost: string;
  unitPrice: string;
  leadTime: string;
  note: string;
}

let nextKey = 1;

export function emptyLine(): GridLine {
  return {
    key: nextKey++,
    partNumber: "",
    name: "",
    unit: "",
    quantity: "",
    unitCost: "",
    fixedCost: "",
    unitPrice: "",
    leadTime: "",
    note: "",
  };
}

function amount(value: number | null | undefined, blankZero = false): string {
  if (value === null || value === undefined || (blankZero && value === 0)) return "";
  return formatNumber(value);
}

export function toGridLine(line: QuotationLine): GridLine {
  return {
    key: nextKey++,
    partNumber: line.partNumber ?? "",
    name: line.name ?? "",
    unit: line.unit ?? "",
    quantity: amount(line.quantity),
    unitCost: amount(line.unitCost),
    fixedCost: amount(line.fixedCost, true),
    unitPrice: amount(line.unitPrice),
    leadTime: line.leadTime ?? "",
    note: line.note ?? "",
  };
}

export function isBlank(line: GridLine): boolean {
  return !line.partNumber.trim() && !line.name.trim();
}

/** The numbers of a row, for the totals. */
export function priced(line: GridLine): PricedLine {
  return {
    quantity: parseAmount(line.quantity) ?? 1,
    unitPrice: parseAmount(line.unitPrice) ?? 0,
    unitCost: parseAmount(line.unitCost),
    fixedCost: parseAmount(line.fixedCost) ?? 0,
  };
}

export function toLineInput(line: GridLine): QuotationLineInput {
  const numbers = priced(line);
  return {
    partNumber: line.partNumber,
    name: line.name,
    unit: line.unit,
    quantity: numbers.quantity,
    unitPrice: numbers.unitPrice,
    unitCost: numbers.unitCost,
    fixedCost: numbers.fixedCost,
    leadTime: line.leadTime,
    note: line.note,
  };
}

type TextColumn = "partNumber" | "name" | "unit" | "leadTime";
type AmountColumn = "quantity" | "unitCost" | "fixedCost" | "unitPrice";

const cell =
  "h-9 w-full rounded-sm border border-transparent bg-transparent px-2 text-sm text-ink placeholder:text-muted/70 " +
  "hover:border-line-strong focus:border-action-600 focus:bg-page disabled:text-body disabled:hover:border-transparent";

/**
 * The lines of a quotation or order, typed like a spreadsheet: Tab walks the cells, Enter drops to the same column
 * of the next row (adding one at the end), and a block of cells pasted from Excel into a part number fills as many
 * rows as it has lines.
 *
 * The tinted columns — purchase cost, fixed cost, suggested price and margin — are internal. They are never printed
 * on what the customer receives; the tint keeps that visible while pricing.
 */
export function LineGrid({
  lines,
  onChange,
  targetMarginPercent,
  priceRounding,
  disabled = false,
  showLeadTime = true,
  onPartNumbers,
}: {
  lines: GridLine[];
  onChange: (lines: GridLine[]) => void;
  targetMarginPercent: number;
  priceRounding: number;
  disabled?: boolean;
  showLeadTime?: boolean;
  /** Called with part numbers that were typed or pasted and still have no name, to look them up. */
  onPartNumbers?: (partNumbers: string[]) => void;
}) {
  const body = useRef<HTMLTableSectionElement>(null);

  function update(index: number, changes: Partial<GridLine>) {
    onChange(lines.map((line, position) => (position === index ? { ...line, ...changes } : line)));
  }

  function setAmount(index: number, column: AmountColumn, value: string) {
    // Grouped as it is typed, so a million and ten million never look alike.
    const parsed = parseAmount(value);
    update(index, { [column]: parsed === null ? "" : formatNumber(parsed) });
  }

  function focus(row: number, column: string) {
    requestAnimationFrame(() => {
      body.current
        ?.querySelector<HTMLInputElement>(`[data-row="${row}"][data-column="${column}"]`)
        ?.focus();
    });
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>, row: number, column: string) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (row === lines.length - 1) onChange([...lines, emptyLine()]);
    focus(row + 1, column);
  }

  function onPaste(event: React.ClipboardEvent<HTMLInputElement>, row: number) {
    const text = event.clipboardData.getData("text");
    if (!isSpreadsheetPaste(text)) return;
    event.preventDefault();
    const pasted = parsePastedLines(text);
    if (pasted.length === 0) return;
    const filled = pasted.map((entry) => ({
      ...emptyLine(),
      partNumber: entry.partNumber,
      name: entry.name,
      unit: entry.unit,
      quantity: amount(entry.quantity ?? 1),
      unitPrice: amount(entry.unitPrice),
    }));
    // Pasted rows replace from the current row down; rows below that already hold something are kept after them.
    const kept = lines.slice(row + filled.length).filter((line) => !isBlank(line));
    onChange([...lines.slice(0, row), ...filled, ...kept].slice(0, 200));
    onPartNumbers?.(
      filled.filter((line) => line.partNumber && !line.name).map((line) => line.partNumber),
    );
  }

  const input = (
    row: number,
    column: TextColumn | AmountColumn,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <input
      {...props}
      data-row={row}
      data-column={column}
      aria-label={`${label}, dòng ${row + 1}`}
      disabled={disabled}
      onKeyDown={(event) => onKeyDown(event, row, column)}
      className={cn(cell, props.className)}
    />
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-page">
      <table className="w-full min-w-[1340px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-surface text-left text-xs font-medium whitespace-nowrap text-muted">
            <th className="w-9 px-2 py-2 text-center">#</th>
            <th className="w-40 px-2 py-2">Mã hàng</th>
            <th className="min-w-60 px-2 py-2">Tên hàng</th>
            <th className="w-16 px-2 py-2">ĐVT</th>
            <th className="w-20 px-2 py-2 text-right">SL</th>
            <th className="w-32 bg-brand-50 px-2 py-2 text-right">Giá vốn / đơn vị</th>
            <th className="w-32 bg-brand-50 px-2 py-2 text-right">CP cố định / đơn vị</th>
            <th className="w-32 bg-brand-50 px-2 py-2 text-right">Giá gợi ý</th>
            <th className="w-32 px-2 py-2 text-right">Đơn giá</th>
            <th className="w-20 bg-brand-50 px-2 py-2 text-right">Biên LN</th>
            {showLeadTime && <th className="w-28 px-2 py-2">TG giao</th>}
            <th className="w-32 px-2 py-2 text-right whitespace-nowrap">Thành tiền</th>
            <th className="w-9 px-1 py-2" />
          </tr>
        </thead>
        <tbody ref={body}>
          {lines.map((line, row) => {
            const numbers = priced(line);
            const suggestion =
              numbers.unitCost === null
                ? null
                : suggestPrice(
                    numbers.unitCost,
                    numbers.fixedCost,
                    targetMarginPercent,
                    priceRounding,
                  );
            const margin = marginPercent(numbers);
            const low = belowTarget(numbers, targetMarginPercent);
            const blank = isBlank(line);
            return (
              <tr
                key={line.key}
                className="border-b border-line last:border-b-0 focus-within:bg-action-50/40"
              >
                <td className="px-2 text-center font-mono text-xs text-muted">{row + 1}</td>
                <td className="px-0.5">
                  {input(row, "partNumber", "Mã hàng", {
                    value: line.partNumber,
                    maxLength: 64,
                    className: "font-mono font-semibold",
                    placeholder: row === 0 ? "Gõ mã hoặc dán từ Excel" : undefined,
                    onChange: (event) => update(row, { partNumber: event.target.value }),
                    onPaste: (event) => onPaste(event, row),
                    onBlur: () => {
                      if (line.partNumber.trim() && !line.name.trim())
                        onPartNumbers?.([line.partNumber.trim()]);
                    },
                  })}
                </td>
                <td className="px-0.5">
                  {input(row, "name", "Tên hàng", {
                    value: line.name,
                    maxLength: 500,
                    onChange: (event) => update(row, { name: event.target.value }),
                  })}
                </td>
                <td className="px-0.5">
                  {input(row, "unit", "Đơn vị tính", {
                    value: line.unit,
                    maxLength: 20,
                    onChange: (event) => update(row, { unit: event.target.value }),
                  })}
                </td>
                <td className="px-0.5">
                  {input(row, "quantity", "Số lượng", {
                    value: line.quantity,
                    inputMode: "numeric",
                    placeholder: blank ? undefined : "1",
                    className: "text-right font-mono",
                    onChange: (event) => setAmount(row, "quantity", event.target.value),
                  })}
                </td>
                <td className="bg-brand-50/60 px-0.5">
                  {input(row, "unitCost", "Giá vốn một đơn vị", {
                    value: line.unitCost,
                    inputMode: "numeric",
                    className: "text-right font-mono",
                    onChange: (event) => setAmount(row, "unitCost", event.target.value),
                  })}
                </td>
                <td className="bg-brand-50/60 px-0.5">
                  {input(row, "fixedCost", "Chi phí cố định một đơn vị", {
                    value: line.fixedCost,
                    inputMode: "numeric",
                    placeholder: blank ? undefined : "0",
                    className: "text-right font-mono",
                    onChange: (event) => setAmount(row, "fixedCost", event.target.value),
                  })}
                </td>
                <td className="bg-brand-50/60 px-1 text-right">
                  {suggestion === null ? (
                    <span className="px-1 text-muted">—</span>
                  ) : (
                    <button
                      type="button"
                      disabled={disabled}
                      // Out of the Tab order: Tab goes from the costs straight to the price.
                      tabIndex={-1}
                      onClick={() => update(row, { unitPrice: formatNumber(suggestion) })}
                      title={`Áp dụng giá gợi ý (biên lợi nhuận ${targetMarginPercent}% trên giá bán)`}
                      className="inline-flex h-8 items-center gap-1 rounded px-1.5 font-mono text-brand-800 hover:bg-brand-100 disabled:hover:bg-transparent"
                    >
                      {!disabled && <Wand2 className="size-3.5" strokeWidth={1.75} aria-hidden />}
                      {formatNumber(suggestion)}
                    </button>
                  )}
                </td>
                <td className="px-0.5">
                  {input(row, "unitPrice", "Đơn giá", {
                    value: line.unitPrice,
                    inputMode: "numeric",
                    placeholder: blank ? undefined : "0",
                    className: "text-right font-mono font-semibold",
                    onChange: (event) => setAmount(row, "unitPrice", event.target.value),
                  })}
                </td>
                <td
                  className={cn(
                    "bg-brand-50/60 px-2 text-right font-mono whitespace-nowrap",
                    low ? "font-semibold text-danger" : "text-body",
                  )}
                >
                  {margin === null ? (
                    <span className="text-muted">—</span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1"
                      title={low ? `Dưới mục tiêu ${targetMarginPercent}%` : undefined}
                    >
                      {low && (
                        <TriangleAlert
                          className="size-3.5"
                          strokeWidth={2}
                          aria-label="Dưới mục tiêu"
                        />
                      )}
                      {formatPercent(margin)}
                    </span>
                  )}
                </td>
                {showLeadTime && (
                  <td className="px-0.5">
                    {input(row, "leadTime", "Thời gian giao", {
                      value: line.leadTime,
                      maxLength: 100,
                      onChange: (event) => update(row, { leadTime: event.target.value }),
                    })}
                  </td>
                )}
                <td className="px-2 text-right font-mono whitespace-nowrap text-ink">
                  {blank ? "" : formatNumber(lineTotal(numbers))}
                </td>
                <td className="px-1 text-center">
                  {!disabled && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() =>
                        onChange(
                          lines.length > 1
                            ? lines.filter((_, position) => position !== row)
                            : [emptyLine()],
                        )
                      }
                      className="inline-flex size-8 items-center justify-center rounded text-muted hover:bg-danger-soft hover:text-danger"
                      aria-label={`Xóa dòng ${row + 1}`}
                    >
                      <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!disabled && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2">
          <button
            type="button"
            onClick={() => {
              onChange([...lines, emptyLine()]);
              focus(lines.length, "partNumber");
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-action-600 hover:text-action-700"
          >
            <Plus className="size-4" strokeWidth={2} aria-hidden />
            Thêm dòng
          </button>
          <p className="text-xs text-muted">
            Enter: xuống dòng dưới · Dán từ Excel vào ô mã hàng: mã, tên, ĐVT, SL, đơn giá ·{" "}
            <span className="rounded-sm bg-brand-50 px-1 text-brand-800">Cột tô màu</span> là số
            liệu nội bộ, không in ra báo giá
          </p>
        </div>
      )}
    </div>
  );
}
