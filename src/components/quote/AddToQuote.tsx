"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { DEFAULT_UNIT, MAX_LINES, type BasketLine } from "@/lib/basket";
import { basket, useBasket } from "@/lib/basket-store";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/cn";

const UNITS = ["cái", "bộ", "chiếc", "mét", "kg", "lít", "hộp"];

/**
 * Adds one line to the quote basket. On a product with several part numbers the buyer picks which one — that is
 * the whole point for a maintenance engineer, who needs the exact size, not the family.
 *
 * After adding, the button turns into a link to the basket rather than a toast that disappears: a buyer who
 * added three filters wants to know where they went.
 */
export function AddToQuote({
  product,
  partNumbers,
  className,
}: {
  product: { slug: string; name: string; imageUrl: string | null };
  partNumbers: string[];
  className?: string;
}) {
  const lines = useBasket();
  const [partNumber, setPartNumber] = useState(partNumbers[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState(DEFAULT_UNIT);
  const [added, setAdded] = useState(false);

  const full = lines.length >= MAX_LINES;

  function add() {
    const line: BasketLine = {
      productSlug: product.slug,
      productName: product.name,
      partNumber: partNumber || null,
      quantity,
      unit,
      imageUrl: product.imageUrl,
    };
    basket.add(line);
    setAdded(true);
  }

  return (
    <div className={cn("rounded-lg border border-line bg-surface p-4", className)}>
      <p className="text-sm font-medium text-ink">Thêm vào yêu cầu báo giá</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        {partNumbers.length > 1 && (
          <label className="block text-sm">
            <span className="mb-1 block text-muted">Mã sản phẩm</span>
            <Select
              value={partNumber}
              onChange={(event) => {
                setPartNumber(event.target.value);
                setAdded(false);
              }}
              className="font-mono"
            >
              {partNumbers.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </label>
        )}

        <label className="block text-sm">
          <span className="mb-1 block text-muted">Số lượng</span>
          <input
            type="number"
            min={1}
            max={9999}
            value={quantity}
            onChange={(event) => {
              setQuantity(Number(event.target.value));
              setAdded(false);
            }}
            className="h-10 w-24 rounded-md border border-line-strong bg-page px-3 text-sm text-ink"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-muted">Đơn vị</span>
          <Select value={unit} onChange={(event) => setUnit(event.target.value)} className="w-28">
            {UNITS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={add} disabled={full} size="lg">
          Thêm vào yêu cầu
        </Button>
        {added && (
          <Link href={routes.quote} className="text-sm font-medium text-brand-700 hover:underline">
            Đã thêm · Xem yêu cầu ({lines.length})
          </Link>
        )}
        {full && <span className="text-sm text-warning">Danh sách đã đủ {MAX_LINES} dòng.</span>}
      </div>
    </div>
  );
}
