import Link from "next/link";
import { connection } from "next/server";
import { ChevronDown } from "lucide-react";
import { getCategories } from "@/lib/api/catalog";
import type { CategoryNode } from "@/lib/api/types";
import { categoryIcon } from "@/components/catalog/categoryStyle";
import { routes } from "@/lib/routes";
import { NavLink } from "./NavLink";

/**
 * Desktop category bar, on graphite below the white command bar: the families are the site's table of contents,
 * so they get a band of their own instead of a row of grey links. Each family carries its icon in brass and shows
 * its types on hover/focus — a plain CSS disclosure, so it needs no JavaScript and the links are in the HTML for
 * crawlers. The current section keeps a brass underline, so the bar also says where the visitor is.
 */
export async function CategoryNav() {
  // Without this the category tree is fetched during `next build` — the shell is in the root layout, so every
  // page, including `/_not-found`, would be prerendered against a live API and a backend blip would fail a
  // deploy. `npm run build:offline` is what catches a missing `connection()` here.
  await connection();
  const categories = await getCategories();

  return (
    <nav aria-label="Danh mục sản phẩm">
      <ul className="-ml-3 flex items-stretch">
        {categories.map((root) => {
          const Icon = categoryIcon(root.slug);
          return (
            <li key={root.slug} className="group relative flex">
              <NavLink
                href={routes.category(root.slug)}
                match={root.children.map((child) => routes.category(child.slug))}
                className={item}
                activeClassName={itemActive}
              >
                <Icon className="size-[18px] text-brand-300" strokeWidth={1.5} aria-hidden />
                {root.name}
                {root.children.length > 0 && (
                  <ChevronDown
                    className="size-4 text-white/50 transition-transform duration-200 group-focus-within:rotate-180 group-hover:rotate-180"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                )}
              </NavLink>
              {root.children.length > 0 && <Submenu family={root} />}
            </li>
          );
        })}
        <li className="flex">
          <NavLink href={routes.brands} className={item} activeClassName={itemActive}>
            Thương hiệu
          </NavLink>
        </li>
        <li className="flex">
          <NavLink href={routes.about} className={item} activeClassName={itemActive}>
            Giới thiệu
          </NavLink>
        </li>
        <li className="flex">
          <NavLink href={routes.contact} className={item} activeClassName={itemActive}>
            Liên hệ
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}

// The underline is a brass bar drawn from the centre, so the hover reads as a stamp rather than a blink.
const item =
  "relative flex h-12 items-center gap-2 px-3.5 text-base font-medium text-white/85 transition-colors " +
  "after:absolute after:inset-x-3.5 after:bottom-0 after:h-[3px] after:origin-center after:scale-x-0 after:rounded-t-sm " +
  "after:bg-brand-300 after:transition-transform after:duration-200 hover:bg-white/[0.06] hover:text-white " +
  "hover:after:scale-x-100 group-focus-within:bg-white/[0.06] group-focus-within:text-white group-focus-within:after:scale-x-100";
const itemActive = "text-white after:scale-x-100";

function Submenu({ family }: { family: CategoryNode }) {
  return (
    <div className="invisible absolute top-full left-0 z-30 min-w-72 translate-y-1 pt-0 opacity-0 transition-[opacity,transform,visibility] duration-150 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
      <ul className="overflow-hidden rounded-b-lg border border-t-0 border-line bg-page py-2 shadow-[0_16px_32px_-12px_rgb(28_34_39/0.35)]">
        {family.children.map((child) => {
          const Icon = categoryIcon(child.slug, family.slug);
          return (
            <li key={child.slug}>
              <Link
                href={routes.category(child.slug)}
                className="group/item flex items-center gap-3 px-4 py-2.5 text-base text-body transition-colors hover:bg-action-50 hover:text-action-700"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface text-muted transition-colors group-hover/item:bg-action-600 group-hover/item:text-white">
                  <Icon className="size-[18px]" strokeWidth={1.5} aria-hidden />
                </span>
                {child.name}
              </Link>
            </li>
          );
        })}
        <li className="mt-1 border-t border-line px-4 pt-2">
          <Link
            href={routes.category(family.slug)}
            className="block py-1.5 text-sm font-semibold text-action-600 hover:underline"
          >
            Xem tất cả {family.name.toLowerCase()} →
          </Link>
        </li>
      </ul>
    </div>
  );
}
