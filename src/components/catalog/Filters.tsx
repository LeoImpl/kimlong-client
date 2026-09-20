import Link from "next/link";
import { cn } from "@/lib/cn";
import type { CategoryNode, Facets } from "@/lib/api/types";
import { routes } from "@/lib/routes";

/**
 * Filter sidebar driven by the API's facet counts. Every option is a plain link to a real URL, so filtering is
 * crawlable, shareable and works without JavaScript — and a count of zero simply never appears, because the API
 * leaves empty facets out.
 */
export function Filters({
  facets,
  subcategories: subcategoryNodes,
  activeBrand,
  activeCategory,
  basePath,
  params,
}: {
  facets: Facets | null;
  subcategories?: CategoryNode[];
  activeBrand?: string;
  activeCategory?: string;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  const brands = facets?.brands ?? [];
  const subcategories = (subcategoryNodes ?? [])
    .map((child) => ({
      child,
      count: facets?.categories.find((c) => c.slug === child.slug)?.count ?? 0,
    }))
    .filter((entry) => entry.count > 0);

  if (brands.length === 0 && subcategories.length === 0) return null;

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

  return (
    <aside className="space-y-6" aria-label="Bộ lọc">
      {subcategories.length > 0 && (
        <Group title="Danh mục con">
          {subcategories.map(({ child, count }) => (
            <Option
              key={child.slug}
              href={routes.category(child.slug)}
              label={child.name}
              count={count}
              active={activeCategory === child.slug}
            />
          ))}
        </Group>
      )}

      {brands.length > 0 && (
        <Group title="Thương hiệu">
          {activeBrand && <Option href={href({ brand: undefined })} label="Tất cả thương hiệu" />}
          {brands.map((brand) => (
            <Option
              key={brand.slug}
              href={href({ brand: brand.slug === activeBrand ? undefined : brand.slug })}
              label={brand.name}
              count={brand.count}
              active={brand.slug === activeBrand}
            />
          ))}
        </Group>
      )}
    </aside>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <ul className="mt-2 space-y-0.5">{children}</ul>
    </section>
  );
}

function Option({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count?: number;
  active?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "true" : undefined}
        className={cn(
          "flex items-center justify-between gap-2 rounded px-2 py-1.5 text-sm",
          active
            ? "bg-brand-50 font-medium text-brand-800"
            : "text-body hover:bg-surface hover:text-ink",
        )}
      >
        <span>{label}</span>
        {count !== undefined && <span className="text-xs text-muted">{count}</span>}
      </Link>
    </li>
  );
}
