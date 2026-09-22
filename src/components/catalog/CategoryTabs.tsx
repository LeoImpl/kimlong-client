import Link from "next/link";
import { listProducts } from "@/lib/api/catalog";
import type { CategoryNode } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { categoryStyle, typeIcon } from "./categoryStyle";

/**
 * One tab per product type inside a family — "Lọc dầu · Lọc gió · Lọc tách dầu" — so switching type is
 * a single, visible choice and the active one is never in doubt. Each tab is a real link to that category's own
 * page, which lists only that category; the brand filter carries over, so "Kobelco" stays selected when a buyer
 * moves from oil filters to air filters. Counts come from the API and respect that brand.
 */
export async function CategoryTabs({
  root,
  active,
  brand,
}: {
  root: CategoryNode;
  active: string;
  brand?: string;
}) {
  if (root.children.length === 0) return null;

  // No "all" tab on purpose: a list of every type at once is exactly the mix the tabs are here to prevent.
  const tabs = root.children.map((child) => ({ slug: child.slug, name: child.name }));
  const counts = await Promise.all(
    tabs.map((tab) =>
      listProducts({ category: tab.slug, brand, size: 1 })
        .then((result) => result.totalItems)
        .catch(() => null),
    ),
  );
  const style = categoryStyle(root.slug);
  const query = brand ? `?brand=${encodeURIComponent(brand)}` : "";

  return (
    <nav aria-label={`Loại sản phẩm trong ${root.name}`} className="mt-6">
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {tabs.map((tab, index) => {
          const isActive = tab.slug === active;
          const count = counts[index];
          const Icon = typeIcon(tab.slug, style);
          return (
            <li key={tab.slug} className="shrink-0">
              <Link
                href={`${routes.category(tab.slug)}${query}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group inline-flex h-10 items-center gap-2 rounded-lg border px-3.5 text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "border-transparent bg-linear-to-r from-navy to-brand-900 text-white shadow-glow"
                    : "border-line/80 bg-page text-body shadow-card hover:-translate-y-0.5 hover:border-brand-200 hover:text-ink",
                )}
              >
                <Icon
                  className={cn(
                    "size-4",
                    isActive ? "text-cyan-300" : "text-muted group-hover:text-brand-700",
                  )}
                  strokeWidth={1.5}
                  aria-hidden
                />
                {tab.name}
                {count !== null && (
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 font-mono text-[11px] font-medium",
                      isActive ? "bg-white/15 text-white" : "bg-surface text-muted",
                    )}
                  >
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
