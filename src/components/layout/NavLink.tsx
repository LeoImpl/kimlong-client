"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/**
 * A navigation link that knows it is the current section. `match` lists the other paths that belong to it — a
 * family is current while the visitor is on one of its types — so the bar always says where you are.
 */
export function NavLink({
  href,
  match = [],
  className,
  activeClassName,
  children,
}: {
  href: string;
  match?: string[];
  className?: string;
  activeClassName?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = [href, ...match].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(className, active && activeClassName)}
    >
      {children}
    </Link>
  );
}
