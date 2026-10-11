"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, FileText, LayoutDashboard, Tags, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { internalRoutes } from "@/lib/internal/routes";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** The dashboard is the root of every other path, so it only matches exactly. */
  exact?: boolean;
}

const items: NavItem[] = [
  { href: internalRoutes.dashboard, label: "Tổng quan", icon: LayoutDashboard, exact: true },
  { href: internalRoutes.customers, label: "Khách hàng", icon: Building2 },
  { href: internalRoutes.quotations, label: "Báo giá", icon: FileText },
  { href: internalRoutes.quotedPrices, label: "Giá đã chào", icon: Tags },
];

export function InternalNav({ badges = {} }: { badges?: Record<string, number> }) {
  const pathname = usePathname();
  return <NavList pathname={pathname} badges={badges} />;
}

/** Rendered without an active item while the pathname is not known yet (the static shell of a dynamic route). */
export function InternalNavFallback() {
  return <NavList pathname={null} badges={{}} />;
}

function NavList({
  pathname,
  badges,
}: {
  pathname: string | null;
  badges: Record<string, number>;
}) {
  return (
    <nav aria-label="Khu vực nội bộ">
      <ul className="flex gap-1 overflow-x-auto px-2 pb-2 lg:block lg:space-y-0.5 lg:overflow-visible lg:px-3 lg:pb-0">
        {items.map((item) => {
          const active =
            pathname !== null &&
            (item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`));
          const badge = badges[item.href];
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-2.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-white/12 text-white shadow-[inset_3px_0_0_var(--color-brand-400)]"
                    : "text-white/70 hover:bg-white/6 hover:text-white",
                )}
              >
                <item.icon className="size-4.5 shrink-0" strokeWidth={1.75} aria-hidden />
                <span className="flex-1">{item.label}</span>
                {badge ? (
                  <span className="rounded-full bg-brand-400 px-1.5 text-xs leading-5 font-semibold text-ink">
                    {badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
