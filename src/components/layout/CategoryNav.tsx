import Link from "next/link";
import { connection } from "next/server";
import { getCategories } from "@/lib/api/catalog";
import type { CategoryNode } from "@/lib/api/types";
import { routes } from "@/lib/routes";

/**
 * Desktop category bar. Each root category shows its children on hover/focus — a plain CSS disclosure, so it
 * needs no JavaScript and the links are in the HTML for crawlers.
 */
export async function CategoryNav() {
  // Without this the category tree is fetched during `next build` — the shell is in the root layout, so every
  // page, including `/_not-found`, would be prerendered against a live API and a backend blip would fail a
  // deploy. `npm run build:offline` is what catches a missing `connection()` here.
  await connection();
  const categories = await getCategories();

  return (
    <nav aria-label="Danh mục sản phẩm" className="hidden lg:block">
      <ul className="flex items-stretch gap-1">
        {categories.map((root) => (
          <li key={root.slug} className="group relative">
            <Link
              href={routes.category(root.slug)}
              className="flex h-11 items-center gap-1 rounded-md px-3 text-sm font-medium text-body hover:bg-surface hover:text-brand-700"
            >
              {root.name}
              {root.children.length > 0 && <Chevron />}
            </Link>
            {root.children.length > 0 && <Submenu items={root.children} />}
          </li>
        ))}
        <li>
          <Link
            href={routes.brands}
            className="flex h-11 items-center rounded-md px-3 text-sm font-medium text-body hover:bg-surface hover:text-brand-700"
          >
            Thương hiệu
          </Link>
        </li>
        <li>
          <Link
            href={routes.about}
            className="flex h-11 items-center rounded-md px-3 text-sm font-medium text-body hover:bg-surface hover:text-brand-700"
          >
            Giới thiệu
          </Link>
        </li>
      </ul>
    </nav>
  );
}

function Submenu({ items }: { items: CategoryNode[] }) {
  return (
    <ul className="invisible absolute top-full left-0 z-20 min-w-56 rounded-lg border border-line bg-page py-2 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
      {items.map((child) => (
        <li key={child.slug}>
          <Link
            href={routes.category(child.slug)}
            className="block px-4 py-2 text-sm text-body hover:bg-surface hover:text-brand-700"
          >
            {child.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-3 text-muted"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path d="m4 6 4 4 4-4" strokeLinecap="round" />
    </svg>
  );
}
