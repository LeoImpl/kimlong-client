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
      className="relative inline-flex h-9 items-center gap-2 rounded-md border border-line-strong bg-page px-3 text-sm font-semibold text-ink shadow-card transition-colors hover:bg-surface"
    >
      <ClipboardList className="size-4" strokeWidth={1.5} aria-hidden />
      <span className="hidden sm:inline">Yêu cầu báo giá</span>
      {lines.length > 0 && (
        // Keyed by the count, so the badge re-mounts and bumps each time a line is added.
        <span
          key={lines.length}
          className="inline-flex h-5 min-w-5 animate-bump items-center justify-center rounded bg-linear-to-br from-brand-700 to-cyan-600 px-1 font-mono text-[11px] font-semibold text-white"
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
