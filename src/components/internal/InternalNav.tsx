"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  FileSignature,
  FileText,
  Inbox,
  LayoutDashboard,
  PackageCheck,
  Tags,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { internalRoutes } from "@/lib/internal/routes";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** The area's own colour: its icon chip, and the glow of the item while it is the current page. */
  hue: string;
  /** The dashboard is the root of every other path, so it only matches exactly. */
  exact?: boolean;
}

const items: NavItem[] = [
  {
    href: internalRoutes.dashboard,
    label: "Tổng quan",
    icon: LayoutDashboard,
    hue: "#3b82f6",
    exact: true,
  },
  { href: internalRoutes.customers, label: "Khách hàng", icon: Building2, hue: "#06b6d4" },
  { href: internalRoutes.quotations, label: "Báo giá", icon: FileText, hue: "#8b5cf6" },
  { href: internalRoutes.quotedPrices, label: "Giá đã chào", icon: Tags, hue: "#f59e0b" },
  { href: internalRoutes.orders, label: "Đơn hàng", icon: PackageCheck, hue: "#10b981" },
  { href: internalRoutes.webRequests, label: "Yêu cầu từ web", icon: Inbox, hue: "#ec4899" },
  {
    href: internalRoutes.paperTemplates,
    label: "Mẫu chứng từ",
    icon: FileSignature,
    hue: "#f97316",
  },
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
      <ul className="flex gap-1 overflow-x-auto px-2 pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:px-3 lg:pb-0">
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
                style={{ "--hue": item.hue } as React.CSSProperties}
                className={cn(
                  "group flex h-11 items-center gap-3 rounded-xl px-2 text-sm font-medium whitespace-nowrap transition-all duration-200",
                  active
                    ? "bg-white/14 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14),0_8px_24px_-12px_var(--hue)]"
                    : "text-white/75 hover:bg-white/8 hover:text-white",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110",
                    active
                      ? "bg-(--hue) text-white shadow-[0_4px_12px_-2px_var(--hue)]"
                      : "bg-[color-mix(in_srgb,var(--hue)_24%,transparent)] text-(--hue)",
                  )}
                  aria-hidden
                >
                  <item.icon className="size-4" strokeWidth={2} />
                </span>
                <span className="flex-1 pr-1">{item.label}</span>
                {badge ? (
                  <span className="mr-1 rounded-full bg-linear-to-r from-[#ec4899] to-[#f97316] px-2 text-xs leading-5 font-bold text-white shadow-[0_2px_10px_-2px_rgb(236_72_153/0.8)]">
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
