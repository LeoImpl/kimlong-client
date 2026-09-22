import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Filters } from "@/components/catalog/Filters";
import { CategoryTabs } from "@/components/catalog/CategoryTabs";
import { CategoryTypePicker } from "@/components/catalog/CategoryTypePicker";
import { ProductListing } from "@/components/catalog/ProductListing";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Feedback";
import { categoryPath, findCategory, getCategories, listProducts } from "@/lib/api/catalog";
import type { CategoryNode } from "@/lib/api/types";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { routes } from "@/lib/routes";

/**
 * A category and everything under it — the page a visitor lands on when they google a category rather than a
 * part number ("lọc dầu máy nén khí Atlas Copco"). Filtering by brand and by subcategory is done with the API's
 * facet counts, so every option is a real link with a real number next to it.
 */
export async function generateMetadata({
  params,
}: PageProps<"/danh-muc/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = findCategory(await getCategories(), slug);
  if (!category) return { title: "Không tìm thấy danh mục" };

  const description =
    category.description ??
    `${category.name} chính hãng cho máy nén khí và hệ thống tự động hóa. Tra cứu theo mã sản phẩm, báo giá nhanh.`;

  return {
    title: category.name,
    description,
    alternates: { canonical: routes.category(category.slug) },
    openGraph: {
      type: "website",
      title: `${category.name} | Kim Long`,
      description,
      url: routes.category(category.slug),
      siteName: "Kim Long",
      locale: "vi_VN",
    },
  };
}

/** Static shell; `params` and the listing stream in (see the product page for why). */
export default function CategoryPage(props: PageProps<"/danh-muc/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CategoryContent {...props} />
    </Suspense>
  );
}

async function CategoryContent({ params, searchParams }: PageProps<"/danh-muc/[slug]">) {
  const { slug } = await params;
  const categories = await getCategories();
  const category = findCategory(categories, slug);
  if (!category) notFound();

  const path = categoryPath(categories, slug);

  return (
    <Container className="py-6 lg:py-10">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Trang chủ", path: routes.home },
          ...path.map((entry) => ({ name: entry.name, path: routes.category(entry.slug) })),
        ])}
      />

      <Breadcrumb
        items={[
          { name: "Trang chủ", href: routes.home },
          ...path
            .slice(0, -1)
            .map((entry) => ({ name: entry.name, href: routes.category(entry.slug) })),
          { name: category.name },
        ]}
      />

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {category.name}
      </h1>
      {category.description && <p className="mt-2 max-w-3xl text-body">{category.description}</p>}

      <Suspense fallback={<ListingSkeleton />}>
        <Listing category={category} parent={path.at(-2)} searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function Listing({
  category,
  parent,
  searchParams,
}: {
  category: CategoryNode;
  /** The category directly above this one, whose types become the tabs; none for a top-level category. */
  parent?: CategoryNode;
  searchParams: PageProps<"/danh-muc/[slug]">["searchParams"];
}) {
  const resolved = await searchParams;
  const brand = single(resolved.brand);
  const view = single(resolved.view);
  const page = Number(single(resolved.page) ?? 0) || 0;

  // A family with types (e.g. compressor parts: oil, air and separator filters) lists nothing itself — the
  // buyer picks a type, and each type page lists only that type.
  if (category.children.length > 0) {
    return <CategoryTypePicker family={category} brand={brand} />;
  }

  const result = await listProducts({ category: category.slug, brand, page, facets: true });
  const basePath = routes.category(category.slug);
  const params = { brand, view };

  return (
    <>
      {parent && (
        <Suspense fallback={<TabsSkeleton />}>
          <CategoryTabs root={parent} active={category.slug} brand={brand} />
        </Suspense>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[248px_1fr]">
        <Filters facets={result.facets} activeBrand={brand} basePath={basePath} params={params} />
        <ProductListing
          result={result}
          basePath={basePath}
          params={params}
          emptyTitle={
            brand
              ? `Chưa có ${category.name.toLowerCase()} của hãng này trên website`
              : "Danh mục này chưa có sản phẩm nào trên website"
          }
          emptyDescription="Kho còn nhiều mã chưa lên website — gọi hoặc gửi yêu cầu, chúng tôi kiểm tra và báo lại."
        />
      </div>
    </>
  );
}

function single(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() || undefined;
}

function PageSkeleton() {
  return (
    <Container className="py-6 lg:py-10" aria-hidden>
      <Skeleton className="h-4 w-64" />
      <Skeleton className="mt-4 h-9 w-72" />
      <ListingSkeleton />
    </Container>
  );
}

function TabsSkeleton() {
  return (
    <div className="mt-6 flex gap-2" aria-hidden>
      {["w-24", "w-28", "w-28", "w-32"].map((width) => (
        <Skeleton key={width} className={`h-10 ${width}`} />
      ))}
    </div>
  );
}

function ListingSkeleton() {
  return (
    <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} className="h-64" />
      ))}
    </div>
  );
}
