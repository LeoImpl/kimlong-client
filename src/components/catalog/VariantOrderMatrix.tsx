"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, Check, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PartNumber } from "@/components/ui/PartNumber";
import { Price } from "@/components/ui/Price";
import { DEFAULT_UNIT, MAX_LINES, MAX_QUANTITY, type BasketLine } from "@/lib/basket";
import { basket, useBasket } from "@/lib/basket-store";
import type { Variant } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

/**
 * The part-number table and the order form in one: every variant is a row with a quantity field, so a buyer
 * collecting a service kit types "2 ↹ 4 ↹ 1" down the column and adds the lot in one click — no dropdown per
 * size. Tab goes from quantity to quantity (the copy buttons are left out of the Tab order), Enter and the arrow
 * keys move between rows like a spreadsheet.
 *
 * Columns that no variant fills are left out entirely, because a table of empty cells reads as missing data
 * rather than as "not applicable here". The table is server-rendered HTML like any other, so crawlers still read
 * every part number.
 */
export function VariantOrderMatrix({
  product,
  variants,
}: {
  product: { slug: string; name: string; imageUrl: string | null };
  variants: Variant[];
}) {
  const lines = useBasket();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [added, setAdded] = useState<number | null>(null);
  const body = useRef<HTMLTableSectionElement>(null);

  const specNames = [...new Set(variants.flatMap((v) => v.specifications.map((s) => s.name)))];
  const showLabel = variants.some((v) => v.label);
  const showOrderCode = variants.some((v) => v.orderCode);
  const showPrice = variants.some((v) => v.price);

  const selected = variants.filter((variant) => (quantities[variant.partNumber] ?? 0) > 0);
  const total = selected.reduce((sum, variant) => sum + quantities[variant.partNumber], 0);
  const inBasket = new Set(
    lines.filter((line) => line.productSlug === product.slug).map((line) => line.partNumber),
  );
  const room = MAX_LINES - lines.length;

  function setQuantity(partNumber: string, value: string) {
    setAdded(null);
    const quantity = Math.min(MAX_QUANTITY, Math.max(0, Math.floor(Number(value) || 0)));
    setQuantities((current) => ({ ...current, [partNumber]: quantity }));
  }

  function focusRow(index: number) {
    body.current?.querySelector<HTMLInputElement>(`[data-row="${index}"]`)?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if ((event.key === "Enter" || event.key === "ArrowDown") && index < variants.length - 1) {
      event.preventDefault();
      focusRow(index + 1);
    } else if (event.key === "ArrowUp" && index > 0) {
      event.preventDefault();
      focusRow(index - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      add();
    }
  }

  function add() {
    if (selected.length === 0) return;
    const newLines: BasketLine[] = selected.map((variant) => ({
      productSlug: product.slug,
      productName: product.name,
      partNumber: variant.partNumber,
      quantity: quantities[variant.partNumber],
      unit: DEFAULT_UNIT,
      imageUrl: product.imageUrl,
    }));
    basket.addAll(newLines);
    setAdded(newLines.length);
    setQuantities({});
  }

  // With nothing but part numbers, a full-width table puts the quantity a screen's width away from its code.
  const narrow = !showLabel && !showOrderCode && !showPrice && specNames.length === 0;

  return (
    <div
      className={cn("overflow-hidden rounded-lg border border-line bg-page", narrow && "max-w-2xl")}
    >
      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            Danh sách mã sản phẩm — nhập số lượng để thêm vào yêu cầu báo giá
          </caption>
          <thead>
            <tr className="bg-surface text-left text-[14px] font-medium whitespace-nowrap text-muted">
              <th scope="col" className="border-b border-line px-4 py-2.5">
                Mã sản phẩm
              </th>
              {showLabel && (
                <th scope="col" className="border-b border-line px-3 py-2.5">
                  Mô tả
                </th>
              )}
              {showOrderCode && (
                <th scope="col" className="border-b border-line px-3 py-2.5">
                  Mã đặt hàng
                </th>
              )}
              {specNames.map((name) => (
                <th key={name} scope="col" className="border-b border-line px-3 py-2.5">
                  {name}
                </th>
              ))}
              {showPrice && (
                <th scope="col" className="border-b border-line px-3 py-2.5 text-right">
                  Đơn giá
                </th>
              )}
              <th scope="col" className="w-36 border-b border-line px-4 py-2.5 text-right">
                Số lượng
              </th>
            </tr>
          </thead>
          <tbody ref={body}>
            {variants.map((variant, index) => {
              const quantity = quantities[variant.partNumber] ?? 0;
              return (
                <tr
                  key={variant.partNumber}
                  className={cn(
                    "transition-colors duration-300 hover:bg-surface",
                    quantity > 0 &&
                      "bg-action-50/70 shadow-[inset_3px_0_0_var(--color-action-600)] hover:bg-action-50",
                  )}
                >
                  <td className="border-b border-line px-4 py-2">
                    <span className="flex items-center gap-2">
                      <PartNumber value={variant.partNumber} copyTabbable={false} />
                      {inBasket.has(variant.partNumber) && (
                        <span
                          className="inline-flex items-center gap-1 rounded bg-success-soft whitespace-nowrap px-1.5 py-0.5 text-[12px] font-medium text-success"
                          title="Đã có trong yêu cầu báo giá"
                        >
                          <Check className="size-3" strokeWidth={2} aria-hidden />
                          Đã chọn
                        </span>
                      )}
                    </span>
                  </td>
                  {showLabel && (
                    <td className="border-b border-line px-3 py-2 text-body">
                      {variant.label ?? "—"}
                    </td>
                  )}
                  {showOrderCode && (
                    <td className="border-b border-line px-3 py-2 font-mono text-xs text-body">
                      {variant.orderCode ?? "—"}
                    </td>
                  )}
                  {specNames.map((name) => (
                    <td key={name} className="border-b border-line px-3 py-2 text-body">
                      {variant.specifications.find((s) => s.name === name)?.value ?? "—"}
                    </td>
                  ))}
                  {showPrice && (
                    <td className="border-b border-line px-3 py-2 text-right">
                      <Price price={variant.price} className="font-mono text-[14px]" />
                    </td>
                  )}
                  <td className="border-b border-line px-4 py-1.5 text-right">
                    <input
                      data-row={index}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={MAX_QUANTITY}
                      value={quantity || ""}
                      placeholder="0"
                      onChange={(event) => setQuantity(variant.partNumber, event.target.value)}
                      onKeyDown={(event) => onKeyDown(event, index)}
                      onFocus={(event) => event.currentTarget.select()}
                      aria-label={`Số lượng mã ${variant.partNumber}`}
                      className={cn(
                        "h-9 w-24 rounded-md border bg-page px-2 text-right font-mono text-[14px] text-ink",
                        "placeholder:text-line-strong focus:border-action-600",
                        quantity > 0 ? "border-action-500" : "border-line-strong",
                      )}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface px-4 py-3">
        <p className="text-sm text-body" aria-live="polite">
          {added !== null ? (
            <Link
              href={routes.quote}
              className="inline-flex animate-pop items-center gap-1.5 font-semibold text-success hover:underline"
            >
              <Check className="size-4" strokeWidth={2} aria-hidden />
              Đã thêm {added} mã · Xem yêu cầu ({lines.length})
              <ArrowRight className="size-3.5" strokeWidth={1.5} aria-hidden />
            </Link>
          ) : selected.length > 0 ? (
            <>
              Đã chọn <strong className="font-mono text-ink">{selected.length}</strong> mã · tổng{" "}
              <strong className="font-mono text-ink">{total}</strong> {DEFAULT_UNIT}
            </>
          ) : (
            <span className="text-muted">Nhập số lượng cho các mã cần báo giá.</span>
          )}
        </p>
        <div className="flex items-center gap-3">
          {selected.length > room && (
            <span className="text-sm text-warning">Yêu cầu chỉ còn chỗ cho {room} mã.</span>
          )}
          <Button
            type="button"
            onClick={add}
            disabled={selected.length === 0 || selected.length > room}
          >
            <ClipboardList className="size-4" strokeWidth={1.5} aria-hidden />
            Thêm vào yêu cầu báo giá
          </Button>
        </div>
      </div>
    </div>
  );
}
