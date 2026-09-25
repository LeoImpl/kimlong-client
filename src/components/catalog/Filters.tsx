import Link from "next/link";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Facets } from "@/lib/api/types";

/**
 * Filter sidebar driven by the API's facet counts, as accordion groups. Every option is a plain link to a real
 * URL and every group a native `<details>`, so filtering is crawlable, shareable and works without JavaScript —
 * and a count of zero simply never appears, because the API leaves empty facets out.
 *
 * Product types are chosen with the tabs above the listing (`CategoryTabs`), so the sidebar only filters.
 * Only facets the catalogue records are offered. Standards (ISO/DIN), material or live stock would need data
 * the API does not have yet; an empty filter group would only promise something the list cannot deliver.
 */
export function Filters({
  facets,
  activeBrand,
  basePath,
  params,
}: {
  facets: Facets | null;
  activeBrand?: string;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  const brands = facets?.brands ?? [];
  if (brands.length === 0) return null;

  // Changing a filter always returns to page 1; keeping the old page number is how a listing shows "no results"
  // for a filter that clearly has some.
  const href = (changes: Record<string, string | undefined>) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...params, ...changes, page: undefined })) {
      if (value) search.set(key, value);
    }
    const query = search.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const activeBrandName = brands.find((brand) => brand.slug === activeBrand)?.name;

  return (
    <aside
      aria-label="Bộ lọc"
      className="self-start overflow-hidden rounded-lg border border-line bg-page lg:sticky lg:top-24"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-lg">Bộ lọc</h2>
        {activeBrand && (
          <Link
            href={href({ brand: undefined })}
            className="text-xs font-medium text-action-600 hover:underline"
          >
            Xóa lọc
          </Link>
        )}
      </div>

      {activeBrandName && (
        <div className="flex flex-wrap gap-1.5 border-b border-line px-4 py-3">
          <Link
            href={href({ brand: undefined })}
            className="inline-flex items-center gap-1 rounded-md border border-line-strong bg-surface px-2 py-0.5 text-[13px] font-medium text-ink hover:border-muted"
            aria-label={`Bỏ lọc thương hiệu ${activeBrandName}`}
          >
            {activeBrandName}
            <X className="size-3" strokeWidth={1.5} aria-hidden />
          </Link>
        </div>
      )}

      {brands.length > 0 && (
        <Group title="Thương hiệu">
          {brands.map((brand) => (
            <Option
              key={brand.slug}
              href={href({ brand: brand.slug === activeBrand ? undefined : brand.slug })}
              label={brand.name}
              count={brand.count}
              active={brand.slug === activeBrand}
              check
            />
          ))}
        </Group>
      )}
    </aside>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open className="group border-b border-line last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[15px] font-semibold text-ink transition-colors select-none hover:bg-surface [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown
          className="size-4 text-muted transition-transform group-open:rotate-180"
          strokeWidth={1.5}
          aria-hidden
        />
      </summary>
      <ul className="space-y-0.5 px-2 pb-3">{children}</ul>
    </details>
  );
}

function Option({
  href,
  label,
  count,
  active,
  check,
}: {
  href: string;
  label: string;
  count?: number;
  active?: boolean;
  /** Render a checkbox look for filters that toggle. */
  check?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "true" : undefined}
        className={cn(
          "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[15px] transition-colors",
          active
            ? "bg-action-50 font-medium text-action-800"
            : "text-body hover:bg-surface hover:text-ink",
        )}
      >
        {check && (
          <span
            className={cn(
              "flex size-4 shrink-0 items-center justify-center rounded border",
              active ? "border-action-600 bg-action-600" : "border-line-strong bg-page",
            )}
            aria-hidden
          >
            {active && (
              <svg viewBox="0 0 12 12" className="size-3 text-white" fill="none">
                <path d="m2.5 6.5 2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            )}
          </span>
        )}
        <span className="flex-1">{label}</span>
        {count !== undefined && (
          <span className="font-mono text-[11px] text-muted tabular-nums">{count}</span>
        )}
      </Link>
    </li>
  );
}
