"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { useBasket } from "@/lib/basket-store";
import { routes } from "@/lib/routes";

/**
 * The quote basket in the header. It renders as zero on the server and updates after hydration (the basket only
 * exists in the browser), which `useSyncExternalStore` makes a clean transition rather than a mismatch.
 */
export function BasketBadge() {
  const lines = useBasket();

  return (
    <Link
      href={routes.quote}
      className="relative inline-flex h-11 items-center gap-2 rounded-[5px] border border-line-strong bg-page px-3 text-sm font-semibold text-ink shadow-[0_1px_0_rgb(28_34_39/0.06)] transition-[color,border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-action-500 hover:text-action-700 hover:shadow-[0_6px_14px_-8px_rgb(31_90_171/0.45)] active:translate-y-px sm:px-4"
    >
      <ClipboardList className="size-[18px]" strokeWidth={1.75} aria-hidden />
      <span className="hidden sm:inline">Yêu cầu báo giá</span>
      {lines.length > 0 && (
        // Keyed by the count, so the badge re-mounts and bumps each time a line is added.
        <span
          key={lines.length}
          className="inline-flex h-5 min-w-5 animate-bump items-center justify-center rounded-full bg-brand-300 px-1.5 font-mono text-xs font-bold text-ink ring-2 ring-page"
        >
          {lines.length}
        </span>
      )}
      <span className="sr-only">
        {lines.length > 0
          ? `${lines.length} sản phẩm trong yêu cầu báo giá`
          : "Yêu cầu báo giá trống"}
      </span>
    </Link>
  );
}
