import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Filters } from "@/components/catalog/Filters";
import { ProductListing } from "@/components/catalog/ProductListing";
import { SearchBox } from "@/components/layout/SearchBox";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Feedback";
import { cn } from "@/lib/cn";
import { getBrands, getCategories, listProducts, searchProducts } from "@/lib/api/catalog";
import { resolveSearchIntent } from "@/lib/search-intent";
import { routes } from "@/lib/routes";

/**
 * Search results and the full catalogue.
 *
 * `?q=` is unbounded user input, so these results are fetched uncached and streamed; browsing without a query is
 * a closed set of URLs and is cached. Either way the markup is server-rendered, which is what lets a visitor
 * paste a search URL into Zalo and lets Google crawl the listing.
 */
export const metadata: Metadata = {
  title: "Sản phẩm",
  description:
    "Tra cứu phụ tùng máy nén khí và thiết bị tự động hóa theo tên hoặc mã sản phẩm: lọc dầu, lọc gió, " +
    "lọc tách dầu, van, xy lanh, cảm biến, biến tần.",
  // One canonical for every `?q=`: the query space is unbounded and the same products are reachable through
  // the categories, so a thousand near-duplicate URLs would only dilute the catalogue.
  alternates: { canonical: routes.products },
};

export default function ProductsPage({ searchParams }: PageProps<"/san-pham">) {
  return (
    <Container className="py-6 lg:py-10">
      <Breadcrumb items={[{ name: "Trang chủ", href: routes.home }, { name: "Sản phẩm" }]} />
      <h1 className="mt-4 text-[2rem] leading-tight sm:text-[2.5rem]">Sản phẩm</h1>

      <Suspense fallback={<Skeleton className="mt-6 h-12 max-w-2xl" />}>
        <QueryBox searchParams={searchParams} />
      </Suspense>

      <Suspense fallback={<ListingSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function QueryBox({
  searchParams,
}: {
  searchParams: PageProps<"/san-pham">["searchParams"];
}) {
  const { q } = await searchParams;
  return (
    <div className="mt-6 max-w-2xl">
      <SearchBox defaultValue={typeof q === "string" ? q : ""} size="lg" />
    </div>
  );
}

async function Results({ searchParams }: { searchParams: PageProps<"/san-pham">["searchParams"] }) {
  const resolved = await searchParams;
  const q = single(resolved.q);
  const brand = single(resolved.brand);
  const view = single(resolved.view);
  const page = Number(single(resolved.page) ?? 0) || 0;

  // A query that is just a product type ("lọc dầu", "lọc gió Kobelco") goes to that category: word search would
  // mix in neighbouring types, e.g. every "lọc tách dầu" for "lọc dầu".
  if (q && !brand && page === 0) {
    const [categories, brands] = await Promise.all([getCategories(), getBrands()]);
    const intent = resolveSearchIntent(q, categories, brands);
    if (intent) {
      const target = routes.category(intent.category);
      redirect(intent.brand ? `${target}?brand=${encodeURIComponent(intent.brand)}` : target);
    }
  }

  const criteria = { q, brand, page, facets: true };
  const result = q ? await searchProducts(criteria) : await listProducts(criteria);
  const params = { q, brand, view };
  // No brand facet (e.g. only unbranded capacitors match) means no sidebar, so no sidebar column either.
  const hasFilters = (result.facets?.brands.length ?? 0) > 0;

  return (
    <div className={cn("mt-8 grid grid-cols-1 gap-8", hasFilters && "lg:grid-cols-[248px_1fr]")}>
      <Filters
        facets={result.facets}
        activeBrand={brand}
        basePath={routes.products}
        params={params}
      />
      <div>
        {q && (
          <p className="mb-4 text-sm text-body">
            Kết quả cho <strong className="font-medium text-ink">“{q}”</strong>
          </p>
        )}
        <ProductListing
          result={result}
          basePath={routes.products}
          params={params}
          emptyTitle={q ? `Không tìm thấy “${q}”` : "Chưa có sản phẩm nào"}
        />
      </div>
    </div>
  );
}

/** A query parameter may repeat (`?brand=a&brand=b`); the first value wins rather than crashing. */
function single(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() || undefined;
}

function ListingSkeleton() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[248px_1fr]" aria-hidden>
      <div className="hidden space-y-3 lg:block">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-32 w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-64" />
        ))}
      </div>
    </div>
  );
}
