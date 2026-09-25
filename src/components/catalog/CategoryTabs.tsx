import Link from "next/link";
import { listProducts } from "@/lib/api/catalog";
import type { CategoryNode } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { categoryIcon } from "./categoryStyle";

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
  const query = brand ? `?brand=${encodeURIComponent(brand)}` : "";

  return (
    <nav aria-label={`Loại sản phẩm trong ${root.name}`} className="mt-6">
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {tabs.map((tab, index) => {
          const isActive = tab.slug === active;
          const count = counts[index];
          const Icon = categoryIcon(tab.slug, root.slug);
          return (
            <li key={tab.slug} className="shrink-0">
              <Link
                href={`${routes.category(tab.slug)}${query}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group inline-flex h-10 items-center gap-2 rounded-md border px-3.5 text-[15px] font-medium transition-colors",
                  isActive
                    ? "border-action-600 bg-action-600 text-white"
                    : "border-line-strong bg-page text-body hover:border-action-500 hover:text-action-700",
                )}
              >
                <Icon
                  className={cn(
                    "size-4",
                    isActive ? "text-white" : "text-muted group-hover:text-action-600",
                  )}
                  strokeWidth={1.5}
                  aria-hidden
                />
                {tab.name}
                {count !== null && (
                  <span
                    className={cn("font-mono text-xs", isActive ? "text-white/70" : "text-muted")}
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
