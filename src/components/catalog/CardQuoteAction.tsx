"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, Plus } from "lucide-react";
import { DEFAULT_UNIT } from "@/lib/basket";
import { basket } from "@/lib/basket-store";
import type { ProductSummary } from "@/lib/api/types";
import { routes } from "@/lib/routes";

/**
 * The card's own call to action, so a buyer can collect parts straight from a listing — the everyday move of a
 * B2B shop. A product with one part number goes into the quote basket in one click (one piece; the quantity is
 * edited on the quote page). A product with several part numbers leads to its order matrix instead, because
 * guessing which size the buyer meant would put the wrong part on the quote.
 *
 * It sits above the card's full-size link (`relative z-10`), so pressing it never also opens the product. It is
 * outlined at rest and fills when the card is hovered: a grid of eight solid buttons would shout over the parts.
 */
export function CardQuoteAction({ product }: { product: ProductSummary }) {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 1800);
    return () => clearTimeout(timer);
  }, [added]);

  const base =
    "relative z-10 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md text-sm font-semibold " +
    "transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.98]";

  if (product.variantCount > 1) {
    return (
      <Link
        href={`${routes.product(product.slug)}#dat-hang`}
        className={`${base} border border-line-strong bg-page text-ink group-hover:border-action-600 group-hover:text-action-700`}
      >
        Chọn trong {product.variantCount} mã
        <ChevronRight className="size-4" strokeWidth={1.5} aria-hidden />
      </Link>
    );
  }

  function add() {
    basket.add({
      productSlug: product.slug,
      productName: product.name,
      partNumber: product.partNumbers[0] ?? null,
      quantity: 1,
      unit: DEFAULT_UNIT,
      imageUrl: product.imageUrl,
    });
    setAdded(true);
  }

  return (
    <button
      type="button"
      onClick={add}
      aria-live="polite"
      className={
        added
          ? `${base} bg-success text-white`
          : `${base} border border-action-600 bg-page text-action-600 group-hover:bg-action-600 group-hover:text-white hover:bg-action-700`
      }
    >
      {added ? (
        <span key="added" className="inline-flex animate-pop items-center gap-1.5">
          <Check className="size-4" strokeWidth={2} aria-hidden />
          Đã thêm vào báo giá
        </span>
      ) : (
        <span key="add" className="inline-flex items-center gap-1.5">
          <Plus className="size-4" strokeWidth={2} aria-hidden />
          Thêm vào báo giá
        </span>
      )}
    </button>
  );
}
