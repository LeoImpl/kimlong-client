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
      className="relative inline-flex h-12 items-center gap-2 rounded-[5px] border border-brand-600 bg-linear-to-b from-brand-200 to-brand-400 px-3 text-base font-bold text-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.5),inset_0_-2px_0_rgb(0_0_0/0.12),0_1px_2px_rgb(28_34_39/0.18)] transition-[color,background-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:from-brand-100 hover:to-brand-300 hover:shadow-[0_8px_18px_-8px_rgb(168_123_42/0.8)] active:translate-y-px sm:px-4"
    >
      <ClipboardList className="size-5" strokeWidth={2} aria-hidden />
      <span className="hidden sm:inline">Yêu cầu báo giá</span>
      {lines.length > 0 && (
        // Keyed by the count, so the badge re-mounts and bumps each time a line is added.
        <span
          key={lines.length}
          className="inline-flex h-6 min-w-6 animate-bump items-center justify-center rounded-full bg-action-600 px-1.5 font-mono text-sm font-bold text-white ring-2 ring-brand-200"
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
