import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Server-rendered pagination: every page is a real URL, so Google can crawl the whole catalogue and a visitor can
 * share or bookmark page 3 of a category. [buildHref] keeps the caller's other query parameters.
 */
export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <nav aria-label="Phân trang" className="flex items-center justify-center gap-1">
      <Step href={buildHref(page - 1)} disabled={page === 0} label="Trang trước">
        <ChevronLeft className="size-4" strokeWidth={1.5} aria-hidden />
      </Step>
      {pages.map((entry, index) =>
        entry === null ? (
          <span key={`gap-${index}`} className="px-2 text-muted" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={entry}
            href={buildHref(entry)}
            aria-current={entry === page ? "page" : undefined}
            className={cn(
              "inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 font-mono text-sm",
              entry === page
                ? "bg-action-600 font-medium text-white"
                : "border border-line bg-page text-body hover:border-line-strong hover:bg-surface",
            )}
          >
            {entry + 1}
          </Link>
        ),
      )}
      <Step href={buildHref(page + 1)} disabled={page >= totalPages - 1} label="Trang sau">
        <ChevronRight className="size-4" strokeWidth={1.5} aria-hidden />
      </Step>
    </nav>
  );
}

function Step({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const className =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-line bg-page";
  if (disabled) {
    return (
      <span className={cn(className, "text-line-strong")} aria-disabled>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={cn(className, "text-body hover:bg-surface")}>
      {children}
    </Link>
  );
}

/** First, last, and the pages around the current one; `null` is a gap. Exported for its test. */
export function pageWindow(page: number, totalPages: number): (number | null)[] {
  const shown = new Set<number>([0, totalPages - 1, page]);
  for (const offset of [-2, -1, 1, 2]) {
    const candidate = page + offset;
    if (candidate >= 0 && candidate < totalPages) shown.add(candidate);
  }
  const sorted = [...shown].sort((a, b) => a - b);
  return sorted.flatMap((value, index) => {
    if (index === 0) return [value];
    const skipped = value - sorted[index - 1] - 1;
    // A "…" that hides a single page is worse than the page itself: same width, one click more.
    if (skipped === 0) return [value];
    if (skipped === 1) return [value - 1, value];
    return [null, value];
  });
}
