"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  ClipboardPaste,
  Download,
  FileUp,
  Loader2,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { resolvePartNumbers } from "@/app/dat-hang-nhanh/actions";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { DEFAULT_UNIT, MAX_LINES, MAX_QUANTITY, type BasketLine } from "@/lib/basket";
import { basket } from "@/lib/basket-store";
import type { PartNumberMatch } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import {
  CSV_TEMPLATE,
  mergeEntries,
  normalizePartNumber,
  parseOrderText,
  type OrderEntry,
} from "@/lib/quick-order";
import { routes } from "@/lib/routes";

interface Row {
  key: number;
  partNumber: string;
  quantity: number;
}

/** A lookup outcome per normalized part number; absent means "not checked yet". */
type Lookup = Map<string, PartNumberMatch | null>;

const INITIAL_ROWS = 5;

let nextKey = 0;
function newRow(entry: Partial<OrderEntry> = {}): Row {
  return { key: nextKey++, partNumber: entry.partNumber ?? "", quantity: entry.quantity ?? 1 };
}

/**
 * Quick order: a spreadsheet-like grid for a buyer who already knows the part numbers. Built for the keyboard —
 * Tab walks part number → quantity → next row, Enter jumps to the next row (adding one at the end), and a block
 * of cells pasted from Excel fills as many rows as it has lines. The same list can come from a CSV file.
 *
 * Part numbers are checked against the catalogue as they are typed. An unknown one is shown as pending, not as an
 * error: sales can often source parts the website does not list, so it still goes into the quote request.
 */
export function QuickOrder() {
  const [rows, setRows] = useState<Row[]>(() =>
    Array.from({ length: INITIAL_ROWS }, () => newRow()),
  );
  const [lookup, setLookup] = useState<Lookup>(() => new Map());
  const [lookupFailed, setLookupFailed] = useState(false);
  const [checking, startChecking] = useTransition();
  const [notice, setNotice] = useState<{ tone: "success" | "warning"; text: string } | null>(null);
  const grid = useRef<HTMLTableSectionElement>(null);
  const file = useRef<HTMLInputElement>(null);

  const filled = rows.filter((row) => row.partNumber.trim().length > 0);
  const entries = mergeEntries(filled);
  const found = entries.filter((entry) => lookup.get(normalizePartNumber(entry.partNumber)));
  const unlisted = entries.filter(
    (entry) => lookup.get(normalizePartNumber(entry.partNumber)) === null,
  );

  // Check new part numbers shortly after typing stops; ones already checked are never asked for again.
  const pending = entries
    .map((entry) => entry.partNumber.trim())
    .filter((value) => !lookup.has(normalizePartNumber(value)));
  const pendingKey = pending.join("\n");
  useEffect(() => {
    if (!pendingKey) return;
    const timer = setTimeout(() => {
      const partNumbers = pendingKey.split("\n");
      startChecking(async () => {
        const result = await resolvePartNumbers(partNumbers);
        setLookupFailed(!result.ok);
        if (!result.ok) return;
        setLookup((current) => {
          const next = new Map(current);
          for (const value of partNumbers) next.set(normalizePartNumber(value), null);
          for (const match of result.matches) next.set(normalizePartNumber(match.query), match);
          return next;
        });
      });
    }, 450);
    return () => clearTimeout(timer);
  }, [pendingKey]);

  function update(key: number, changes: Partial<Row>) {
    setNotice(null);
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...changes } : row)));
  }

  function remove(key: number) {
    setRows((current) => {
      const next = current.filter((row) => row.key !== key);
      return next.length > 0 ? next : [newRow()];
    });
  }

  /** Puts a list into the grid from row [at] on, reusing empty rows and capping at the basket's size. */
  function fill(list: OrderEntry[], at = rows.findIndex((row) => !row.partNumber.trim())) {
    if (list.length === 0) return;
    const start = at < 0 ? rows.length : at;
    const before = rows.slice(0, start);
    const after = rows.slice(start + 1).filter((row) => row.partNumber.trim());
    const room = MAX_LINES - before.filter((row) => row.partNumber.trim()).length - after.length;
    const incoming = list.slice(0, Math.max(0, room)).map(newRow);
    setRows([...before, ...incoming, ...after, newRow()]);
    setNotice(
      list.length > incoming.length
        ? {
            tone: "warning",
            text: `Mỗi yêu cầu tối đa ${MAX_LINES} dòng — đã bỏ ${list.length - incoming.length} dòng cuối.`,
          }
        : null,
    );
  }

  function focusCell(rowIndex: number, column: "pn" | "qty") {
    // After a state change the target row may not exist yet; wait for the commit.
    requestAnimationFrame(() => {
      grid.current
        ?.querySelector<HTMLInputElement>(`[data-row="${rowIndex}"][data-col="${column}"]`)
        ?.focus();
    });
  }

  function onCellKeyDown(event: React.KeyboardEvent<HTMLInputElement>, index: number) {
    const column = event.currentTarget.dataset.col as "pn" | "qty";
    if (event.key === "Enter") {
      event.preventDefault();
      if (index === rows.length - 1) setRows((current) => [...current, newRow()]);
      focusCell(index + 1, "pn");
    } else if (event.key === "ArrowDown" && index < rows.length - 1) {
      event.preventDefault();
      focusCell(index + 1, column);
    } else if (event.key === "ArrowUp" && index > 0) {
      event.preventDefault();
      focusCell(index - 1, column);
    }
  }

  function onPaste(event: React.ClipboardEvent<HTMLInputElement>, index: number) {
    const text = event.clipboardData.getData("text");
    // A single value pastes normally; only a block of cells (several lines or columns) spreads over rows.
    if (!/[\n\t]/.test(text.trim())) return;
    event.preventDefault();
    fill(parseOrderText(text), index);
  }

  async function onUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const upload = event.target.files?.[0];
    event.target.value = "";
    if (!upload) return;
    if (upload.size > 512 * 1024) {
      setNotice({ tone: "warning", text: "File quá lớn. Vui lòng dùng file CSV dưới 500 KB." });
      return;
    }
    const list = parseOrderText(await upload.text());
    if (list.length === 0) {
      setNotice({
        tone: "warning",
        text: "Không đọc được mã nào. File cần cột 1 là mã sản phẩm, cột 2 là số lượng.",
      });
      return;
    }
    fill(list);
  }

  function addToQuote() {
    const lines: BasketLine[] = entries.map((entry) => {
      const match = lookup.get(normalizePartNumber(entry.partNumber));
      return match
        ? {
            productSlug: match.productSlug,
            productName: match.productName,
            partNumber: match.partNumber,
            quantity: entry.quantity,
            unit: DEFAULT_UNIT,
            imageUrl: null,
          }
        : {
            productSlug: null,
            productName: `Mã ${entry.partNumber.trim()}`,
            partNumber: entry.partNumber.trim(),
            quantity: entry.quantity,
            unit: DEFAULT_UNIT,
            imageUrl: null,
          };
    });
    basket.addAll(lines);
    setRows(Array.from({ length: INITIAL_ROWS }, () => newRow()));
    setNotice({ tone: "success", text: `Đã thêm ${lines.length} mã vào yêu cầu báo giá.` });
  }

  const templateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section
        aria-labelledby="grid-heading"
        className="overflow-hidden rounded-lg border border-line/80 bg-page shadow-card"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/80 px-4 py-3">
          <div>
            <h2 id="grid-heading" className="text-sm font-semibold text-ink">
              Danh sách mã
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              <kbd className="font-mono">Tab</kbd> sang ô kế ·{" "}
              <kbd className="font-mono">Enter</kbd> xuống dòng · dán nhiều dòng từ Excel
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={file}
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              onChange={onUpload}
              className="sr-only"
              id="quick-order-file"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => file.current?.click()}
            >
              <FileUp className="size-4" strokeWidth={1.5} aria-hidden />
              Tải lên CSV
            </Button>
            <a
              href={templateHref}
              download="kimlong-dat-hang-mau.csv"
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
            >
              <Download className="size-4" strokeWidth={1.5} aria-hidden />
              File mẫu
            </a>
          </div>
        </div>

        <div className="relative overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Nhập mã sản phẩm và số lượng</caption>
            <thead>
              <tr className="bg-surface text-left text-xs font-semibold tracking-wide text-muted uppercase">
                <th scope="col" className="w-10 border-b border-line px-3 py-2 text-right">
                  #
                </th>
                <th scope="col" className="border-b border-line px-3 py-2">
                  Mã sản phẩm / Part number
                </th>
                <th scope="col" className="w-28 border-b border-line px-3 py-2">
                  Số lượng
                </th>
                <th scope="col" className="border-b border-line px-3 py-2">
                  Kết quả tra cứu
                </th>
                <th scope="col" className="w-10 border-b border-line px-2 py-2">
                  <span className="sr-only">Xóa</span>
                </th>
              </tr>
            </thead>
            <tbody ref={grid}>
              {rows.map((row, index) => (
                <tr key={row.key} className="group transition-colors hover:bg-slate-50/80">
                  <td className="border-b border-line/80 px-3 py-1.5 text-right font-mono text-xs text-muted">
                    {index + 1}
                  </td>
                  <td className="border-b border-line/80 px-2 py-1.5">
                    <input
                      data-row={index}
                      data-col="pn"
                      value={row.partNumber}
                      onChange={(event) => update(row.key, { partNumber: event.target.value })}
                      onKeyDown={(event) => onCellKeyDown(event, index)}
                      onPaste={(event) => onPaste(event, index)}
                      placeholder={index === 0 ? "vd. 1613900100" : undefined}
                      aria-label={`Mã sản phẩm dòng ${index + 1}`}
                      autoComplete="off"
                      spellCheck={false}
                      maxLength={64}
                      className="h-9 w-full min-w-44 rounded border border-transparent bg-transparent px-2 font-mono text-[13px] text-ink uppercase placeholder:text-muted placeholder:normal-case hover:border-line focus:border-brand-700 focus:bg-page"
                    />
                  </td>
                  <td className="border-b border-line/80 px-2 py-1.5">
                    <input
                      data-row={index}
                      data-col="qty"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={MAX_QUANTITY}
                      value={row.quantity}
                      onChange={(event) =>
                        update(row.key, { quantity: Number(event.target.value) })
                      }
                      onKeyDown={(event) => onCellKeyDown(event, index)}
                      aria-label={`Số lượng dòng ${index + 1}`}
                      className="h-9 w-full rounded border border-transparent bg-transparent px-2 text-right font-mono text-[13px] text-ink hover:border-line focus:border-brand-700 focus:bg-page"
                    />
                  </td>
                  <td className="border-b border-line/80 px-3 py-1.5">
                    <RowStatus
                      partNumber={row.partNumber}
                      lookup={lookup}
                      checking={checking}
                      failed={lookupFailed}
                    />
                  </td>
                  <td className="border-b border-line/80 px-2 py-1.5">
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => remove(row.key)}
                      aria-label={`Xóa dòng ${index + 1}`}
                      className="rounded p-1.5 text-muted opacity-0 transition group-hover:opacity-100 hover:bg-danger-soft hover:text-danger focus-visible:opacity-100"
                    >
                      <Trash2 className="size-4" strokeWidth={1.5} aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={rows.length >= MAX_LINES}
            onClick={() => {
              setRows((current) => [...current, newRow()]);
              focusCell(rows.length, "pn");
            }}
          >
            <Plus className="size-4" strokeWidth={1.5} aria-hidden />
            Thêm dòng
          </Button>
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <ClipboardPaste className="size-3.5" strokeWidth={1.5} aria-hidden />
            Mẹo: chọn 2 cột trong Excel, Ctrl+C rồi dán vào ô mã đầu tiên.
          </span>
        </div>
      </section>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-lg border border-line/80 bg-page p-5 shadow-card">
          <h2 className="text-sm font-semibold text-ink">Tóm tắt</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <Stat label="Số mã" value={entries.length} />
            <Stat
              label="Có trên website"
              value={found.length}
              icon={<CheckCircle2 className="size-4 text-success" strokeWidth={1.5} />}
            />
            <Stat
              label="Chờ sales kiểm tra"
              value={unlisted.length}
              icon={<CircleDashed className="size-4 text-warning" strokeWidth={1.5} />}
            />
            <Stat
              label="Tổng số lượng"
              value={entries.reduce((sum, entry) => sum + entry.quantity, 0)}
            />
          </dl>

          <Button
            type="button"
            size="lg"
            className="mt-5 w-full"
            disabled={entries.length === 0}
            onClick={addToQuote}
          >
            Thêm vào yêu cầu báo giá
          </Button>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Mã chưa có trên website vẫn được gửi — đội kinh doanh sẽ kiểm tra nguồn hàng và báo giá
            cho bạn.
          </p>

          {notice && (
            <Alert tone={notice.tone} className="mt-4 animate-pop">
              {notice.text}
              {notice.tone === "success" && (
                <Link
                  href={routes.quote}
                  className="mt-1 flex items-center gap-1 font-semibold underline-offset-2 hover:underline"
                >
                  Xem yêu cầu và gửi
                  <ArrowRight className="size-3.5" strokeWidth={1.5} aria-hidden />
                </Link>
              )}
            </Alert>
          )}
        </div>
      </aside>
    </div>
  );
}

function RowStatus({
  partNumber,
  lookup,
  checking,
  failed,
}: {
  partNumber: string;
  lookup: Lookup;
  checking: boolean;
  failed: boolean;
}) {
  const key = normalizePartNumber(partNumber);
  if (!key) return null;

  const match = lookup.get(key);
  if (match) {
    return (
      <span className="flex min-w-0 animate-fade-in items-center gap-2">
        <CheckCircle2 className="size-4 shrink-0 text-success" strokeWidth={1.5} aria-hidden />
        <Link
          href={routes.product(match.productSlug)}
          target="_blank"
          rel="noopener"
          tabIndex={-1}
          className="truncate text-body hover:text-brand-700"
          title={match.productName}
        >
          {match.productName}
        </Link>
      </span>
    );
  }
  if (match === null) {
    return (
      <span className="flex animate-fade-in items-center gap-2 text-warning">
        <CircleDashed className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
        Chưa có trên web · sales kiểm tra
      </span>
    );
  }
  if (failed && !checking) {
    return (
      <span className="flex items-center gap-2 text-muted">
        <TriangleAlert className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
        Chưa kiểm tra được
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2 text-muted">
      <Loader2 className="size-4 shrink-0 animate-spin" strokeWidth={1.5} aria-hidden />
      Đang tra cứu…
    </span>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-body">
        {icon}
        {label}
      </dt>
      <dd className={cn("font-mono font-semibold text-ink", value === 0 && "text-muted")}>
        {value}
      </dd>
    </div>
  );
}
