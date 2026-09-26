import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { ProductListing } from "@/components/catalog/ProductListing";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Feedback";
import { getBrands, listProducts } from "@/lib/api/catalog";
import type { Facets } from "@/lib/api/types";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { routes } from "@/lib/routes";

async function findBrand(slug: string) {
  const brands = await getBrands();
  return brands.find((brand) => brand.slug === slug) ?? null;
}

export async function generateMetadata({
  params,
}: PageProps<"/thuong-hieu/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const brand = await findBrand(slug);
  if (!brand) return { title: "Không tìm thấy thương hiệu" };

  const description =
    brand.description ??
    `Phụ tùng và thiết bị ${brand.name} chính hãng. Tra cứu theo mã sản phẩm, báo giá nhanh.`;

  return {
    title: brand.name,
    description,
    alternates: { canonical: routes.brand(brand.slug) },
    openGraph: {
      type: "website",
      title: `${brand.name} | Kim Long`,
      description,
      url: routes.brand(brand.slug),
      siteName: "Kim Long",
      locale: "vi_VN",
    },
  };
}

/** Static shell; `params` and the listing stream in (see the product page for why). */
export default function BrandPage(props: PageProps<"/thuong-hieu/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BrandContent {...props} />
    </Suspense>
  );
}

async function BrandContent({ params, searchParams }: PageProps<"/thuong-hieu/[slug]">) {
  const { slug } = await params;
  const brand = await findBrand(slug);
  if (!brand) notFound();

  return (
    <Container className="py-6 lg:py-10">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Trang chủ", path: routes.home },
          { name: "Thương hiệu", path: routes.brands },
          { name: brand.name, path: routes.brand(brand.slug) },
        ])}
      />

      <Breadcrumb
        items={[
          { name: "Trang chủ", href: routes.home },
          { name: "Thương hiệu", href: routes.brands },
          { name: brand.name },
        ]}
      />

      <h1 className="mt-4 text-[2rem] leading-tight sm:text-[2.5rem]">{brand.name}</h1>
      {brand.description && <p className="mt-2 max-w-3xl text-body">{brand.description}</p>}
      {brand.websiteUrl && (
        <a
          href={brand.websiteUrl}
          target="_blank"
          rel="noopener nofollow"
          className="mt-2 inline-block text-sm text-action-600 hover:underline"
        >
          Trang chủ hãng
        </a>
      )}

      <Suspense fallback={<ListingSkeleton />}>
        <Listing slug={slug} searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function Listing({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams: PageProps<"/thuong-hieu/[slug]">["searchParams"];
}) {
  await connection();
  const resolved = await searchParams;
  const raw = Array.isArray(resolved.page) ? resolved.page[0] : resolved.page;
  const page = Number(raw ?? 0) || 0;
  const view = Array.isArray(resolved.view) ? resolved.view[0] : resolved.view;

  const result = await listProducts({ brand: slug, page, facets: true });
  const basePath = routes.brand(slug);

  return (
    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[248px_1fr]">
      {/* Only the category facet is useful here: filtering this brand by this brand would be a no-op. */}
      <CategoryFacets facets={result.facets} brandSlug={slug} />
      <ProductListing
        result={result}
        basePath={basePath}
        params={{ view }}
        emptyTitle={`Chưa có sản phẩm ${slug} nào trên website`}
      />
    </div>
  );
}

/** Where this brand's products sit in the catalogue; each link keeps the brand filter. */
function CategoryFacets({ facets, brandSlug }: { facets: Facets | null; brandSlug: string }) {
  if (!facets || facets.categories.length === 0) return null;
  return (
    <aside
      aria-label="Danh mục"
      className="self-start overflow-hidden rounded-lg border border-line bg-page lg:sticky lg:top-24"
    >
      <h2 className="border-b border-line px-4 py-3 text-lg">Danh mục</h2>
      <ul className="space-y-0.5 p-2">
        {facets.categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={`${routes.category(category.slug)}?brand=${encodeURIComponent(brandSlug)}`}
              className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-body transition-colors hover:bg-surface hover:text-ink"
            >
              <span>{category.name}</span>
              <span className="font-mono text-[12px] text-muted">{category.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function PageSkeleton() {
  return (
    <Container className="py-6 lg:py-10" aria-hidden>
      <Skeleton className="h-4 w-56" />
      <Skeleton className="mt-4 h-9 w-64" />
      <ListingSkeleton />
    </Container>
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
