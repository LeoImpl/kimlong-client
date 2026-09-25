"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DEFAULT_UNIT, MAX_LINES, MAX_QUANTITY } from "@/lib/basket";
import { basket, useBasket } from "@/lib/basket-store";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/cn";

/**
 * Adds a product without part numbers to the quote basket, as a family. Products with part numbers are ordered
 * through the variant matrix instead, where each size gets its own quantity.
 *
 * After adding, a link to the basket replaces the hint rather than a toast that disappears: a buyer who added
 * three filters wants to know where they went.
 */
export function AddToQuote({
  product,
  className,
}: {
  product: { slug: string; name: string; imageUrl: string | null };
  className?: string;
}) {
  const lines = useBasket();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const full = lines.length >= MAX_LINES;

  function add() {
    basket.add({
      productSlug: product.slug,
      productName: product.name,
      partNumber: null,
      quantity,
      unit: DEFAULT_UNIT,
      imageUrl: product.imageUrl,
    });
    setAdded(true);
  }

  return (
    <div className={cn("flex flex-wrap items-end gap-3", className)}>
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-medium text-muted">Số lượng ({DEFAULT_UNIT})</span>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_QUANTITY}
          value={quantity}
          onChange={(event) => {
            setQuantity(Number(event.target.value));
            setAdded(false);
          }}
          className="h-12 w-28 rounded-md border border-line-strong bg-page px-3 text-right font-mono text-sm text-ink focus:border-action-600"
        />
      </label>
      <Button onClick={add} disabled={full} size="lg">
        <ClipboardList className="size-4" strokeWidth={1.5} aria-hidden />
        Thêm vào yêu cầu báo giá
      </Button>
      {added && (
        <Link
          href={routes.quote}
          className="inline-flex items-center gap-1.5 self-center text-sm font-semibold text-success hover:underline"
        >
          <Check className="size-4" strokeWidth={2} aria-hidden />
          Đã thêm · Xem yêu cầu ({lines.length})
          <ArrowRight className="size-3.5" strokeWidth={1.5} aria-hidden />
        </Link>
      )}
      {full && <span className="text-sm text-warning">Danh sách đã đủ {MAX_LINES} dòng.</span>}
    </div>
  );
}
