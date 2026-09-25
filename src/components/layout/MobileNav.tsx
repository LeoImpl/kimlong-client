"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CategoryNode } from "@/lib/api/types";
import { routes } from "@/lib/routes";

/**
 * Category navigation on a phone. A disclosure rather than a full-screen overlay: the tree is two levels and
 * sixteen nodes, so a panel that pushes the page down is simpler and never traps focus.
 */
export function MobileNav({ categories }: { categories: CategoryNode[] }) {
  const [open, setOpen] = useState(false);

  // A navigation that stays open after the page changed looks broken; closing on Escape is the keyboard's way out.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        className="flex h-10 items-center gap-2 rounded-md border border-line-strong px-3 text-sm font-medium text-ink"
      >
        <svg
          viewBox="0 0 20 20"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden
        >
          <path d="M3 5.5h14M3 10h14M3 14.5h14" strokeLinecap="round" />
        </svg>
        Danh mục
      </button>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Danh mục sản phẩm"
          className="mt-3 rounded-lg border border-line bg-page p-2"
        >
          <ul className="divide-y divide-line">
            {categories.map((root) => (
              <li key={root.slug} className="py-2">
                <Link
                  href={routes.category(root.slug)}
                  onClick={() => setOpen(false)}
                  className="block px-2 py-1.5 text-sm font-medium text-ink"
                >
                  {root.name}
                </Link>
                {root.children.length > 0 && (
                  <ul className="mt-1">
                    {root.children.map((child) => (
                      <li key={child.slug}>
                        <Link
                          href={routes.category(child.slug)}
                          onClick={() => setOpen(false)}
                          className="block px-2 py-1.5 pl-5 text-sm text-body"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-2 border-t border-line pt-3">
            <Link
              href={routes.brands}
              onClick={() => setOpen(false)}
              className="block px-2 py-1.5 text-sm font-medium text-action-600"
            >
              Tất cả thương hiệu
            </Link>
            <Link
              href={routes.about}
              onClick={() => setOpen(false)}
              className="block px-2 py-1.5 text-sm font-medium text-action-600"
            >
              Giới thiệu
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}
