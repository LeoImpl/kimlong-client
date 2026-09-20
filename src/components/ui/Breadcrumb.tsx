import Link from "next/link";

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
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.name}-${index}`} className="flex items-center gap-1.5">
              {item.href && !last ? (
                <Link href={item.href} className="hover:text-brand-700 hover:underline">
                  {item.name}
                </Link>
              ) : (
                <span
                  className={last ? "text-body" : undefined}
                  aria-current={last ? "page" : undefined}
                >
                  {item.name}
                </span>
              )}
              {!last && <span aria-hidden>/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
