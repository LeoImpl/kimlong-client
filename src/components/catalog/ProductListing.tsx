import Link from "next/link";
import { LayoutGrid, Rows3 } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { Pagination } from "@/components/ui/Pagination";
import type { ProductPage } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { ProductGrid } from "./ProductCard";
import { ProductTable } from "./ProductTable";

/** `?view=bang` shows the dense table; anything else the grid. A URL, so a chosen view survives a shared link. */
export type ListingView = "grid" | "table";

export function listingView(value: string | undefined): ListingView {
  return value === "bang" ? "table" : "grid";
}

/**
 * Toolbar, grid or table, and pagination — the same three things on the search page, category pages and brand
 * pages, so they are assembled once here.
 */
export function ProductListing({
  result,
  basePath,
  params,
  emptyTitle = "Không tìm thấy sản phẩm nào",
  emptyDescription = "Thử tìm bằng mã sản phẩm (ví dụ 1613900100), hoặc gọi cho chúng tôi — kho còn nhiều mã chưa lên website.",
}: {
  result: ProductPage;
  basePath: string;
  /** The page's query parameters, including `view`; they are kept by pagination and the view toggle. */
  params: Record<string, string | undefined>;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (result.items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={
          <>
            <ButtonLink href={routes.quickOrder}>Gửi danh sách mã</ButtonLink>
            <ButtonLink href={routes.contact} variant="secondary">
              Liên hệ tư vấn
            </ButtonLink>
          </>
        }
      />
    );
  }

  const view = listingView(params.view);
  const href = listingHref(basePath, params);

  return (
    <div className="min-w-0 space-y-4">
      <ListingToolbar
        total={result.totalItems}
        page={result.page}
        totalPages={result.totalPages}
        basePath={basePath}
        params={params}
      />

      {view === "table" ? (
        <ProductTable products={result.items} />
      ) : (
        <ProductGrid products={result.items} />
      )}

      <div className="pt-2">
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          buildHref={(page) => href({ page: page > 0 ? String(page) : undefined })}
        />
      </div>
    </div>
  );
}

function listingHref(basePath: string, params: Record<string, string | undefined>) {
  return (changes: Record<string, string | undefined>) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...params, ...changes })) {
      if (value) search.set(key, value);
    }
    const query = search.toString();
    return query ? `${basePath}?${query}` : basePath;
  };
}

/** Result count and the grid/table switch. */
function ListingToolbar({
  total,
  page = 0,
  totalPages = 1,
  basePath,
  params,
}: {
  total: number;
  page?: number;
  totalPages?: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  const view = listingView(params.view);
  const href = listingHref(basePath, { ...params, page: undefined });
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted">
        <strong className="font-mono font-semibold text-ink">{total}</strong> sản phẩm
        {totalPages > 1 && (
          <span className="ml-2 font-mono text-xs">
            · trang {page + 1}/{totalPages}
          </span>
        )}
      </p>
      <nav
        aria-label="Kiểu hiển thị"
        className="flex rounded-md border border-line/80 bg-page p-0.5 shadow-card"
      >
        <ViewLink href={href({ view: undefined })} active={view === "grid"} label="Dạng lưới">
          <LayoutGrid className="size-4" strokeWidth={1.5} aria-hidden />
        </ViewLink>
        <ViewLink href={href({ view: "bang" })} active={view === "table"} label="Dạng bảng">
          <Rows3 className="size-4" strokeWidth={1.5} aria-hidden />
        </ViewLink>
      </nav>
    </div>
  );
}

function ViewLink({
  href,
  active,
  label,
  children,
}: {
  href: string;
  active: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      aria-current={active ? "true" : undefined}
      scroll={false}
      className={cn(
        "flex h-7 w-8 items-center justify-center rounded transition-colors",
        active ? "bg-navy text-white" : "text-muted hover:bg-surface hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
