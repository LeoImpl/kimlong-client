"use client";

import Link from "next/link";
import { useBasket } from "@/lib/basket-store";
import { routes } from "@/lib/routes";

/**
 * The basket count in the header. It renders as zero on the server and updates after hydration (the basket only
 * exists in the browser), which `useSyncExternalStore` makes a clean transition rather than a mismatch.
 */
export function BasketBadge() {
  const lines = useBasket();

  return (
    <Link
      href={routes.quote}
      className="relative inline-flex h-9 items-center gap-2 rounded-md border border-line-strong px-3 text-sm font-medium text-ink hover:bg-surface"
    >
      <svg
        viewBox="0 0 20 20"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        aria-hidden
      >
        <path d="M3 4h2l1.5 8.5h9L17 7H6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8" cy="16" r="1.2" />
        <circle cx="15" cy="16" r="1.2" />
      </svg>
      <span className="hidden sm:inline">Yêu cầu</span>
      {lines.length > 0 && (
        <span className="inline-flex size-5 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">
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
