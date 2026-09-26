import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  name: string;
  href?: string;
}

/**
 * Breadcrumbs matter more here than on most sites: most visitors arrive on a deep product page from Google and
 * have no idea where they are. The current page is the last item and is not a link.
 */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Đường dẫn">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[14px] text-muted">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.name}-${index}`} className="flex items-center gap-1">
              {item.href && !last ? (
                <Link href={item.href} className="hover:text-action-600">
                  {item.name}
                </Link>
              ) : (
                <span
                  className={last ? "font-medium text-ink" : undefined}
                  aria-current={last ? "page" : undefined}
                >
                  {item.name}
                </span>
              )}
              {!last && (
                <ChevronRight className="size-3.5 text-line-strong" strokeWidth={1.5} aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
