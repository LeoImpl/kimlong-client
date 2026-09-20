import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { Pagination } from "@/components/ui/Pagination";
import type { ProductPage } from "@/lib/api/types";
import { routes } from "@/lib/routes";
import { ProductGrid } from "./ProductCard";

/**
 * Grid, result count and pagination — the same three things on the search page, category pages and brand pages,
 * so they are assembled once here.
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
            <ButtonLink href={routes.contact}>Liên hệ tư vấn</ButtonLink>
            <ButtonLink href={routes.products} variant="secondary">
              Xem tất cả sản phẩm
            </ButtonLink>
          </>
        }
      />
    );
  }

  const buildHref = (page: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
    if (page > 0) search.set("page", String(page));
    const query = search.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        <strong className="font-medium text-ink">{result.totalItems}</strong> sản phẩm
      </p>
      <ProductGrid products={result.items} />
      <Pagination page={result.page} totalPages={result.totalPages} buildHref={buildHref} />
    </div>
  );
}
