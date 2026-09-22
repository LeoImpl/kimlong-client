import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, FileUp } from "lucide-react";
import { connection } from "next/server";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { SearchBox } from "@/components/layout/SearchBox";
import { ButtonLink } from "@/components/ui/Button";
import { Container, SectionHeading } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Feedback";
import { flattenCategories, getBrands, getCategories, listProducts } from "@/lib/api/catalog";
import { getCompany, getPartners } from "@/lib/api/company";
import { JsonLd, organizationJsonLd } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { env } from "@/lib/env";

/**
 * The home page is not where the money is — most visitors arrive on a product page from Google — but it is where
 * a buyer who was sent a link decides whether this supplier is credible. So: search first, then what we sell,
 * then who we represent.
 *
 * The hero is static HTML in the build; everything that needs the API streams in behind its own boundary.
 */
export const metadata: Metadata = {
  alternates: { canonical: routes.home },
  openGraph: {
    type: "website",
    title: "Kim Long — Phụ tùng máy nén khí & thiết bị tự động hóa",
    description:
      "Tra cứu phụ tùng máy nén khí và thiết bị tự động hóa theo mã sản phẩm. Báo giá nhanh, giao hàng toàn quốc.",
    url: routes.home,
    siteName: "Kim Long",
    locale: "vi_VN",
  },
};

export default function Home() {
  return (
    <>
      <Suspense fallback={null}>
        <StructuredData />
      </Suspense>

      <section className="border-b border-line/80 bg-page">
        <Container className="grid gap-10 py-10 lg:grid-cols-12 lg:py-14">
          <div className="lg:col-span-7">
            <p className="font-mono text-xs font-medium tracking-wider text-brand-700 uppercase">
              Nhà cung cấp B2B · Phụ tùng công nghiệp
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance text-ink sm:text-4xl">
              Phụ tùng máy nén khí &amp; thiết bị tự động hóa chính hãng
            </h1>
            <p className="mt-4 max-w-xl text-base text-balance text-body sm:text-lg">
              Tra cứu theo mã sản phẩm, part number hoặc hãng. Báo giá sỉ theo số lượng, giao hàng
              toàn quốc.
            </p>
            <div className="mt-7 max-w-xl">
              <SearchBox size="lg" />
            </div>
            <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
              Thử:
              <SearchExample q="1613900100" />
              <SearchExample q="DSBC-32-50" />
              <SearchExample q="lọc dầu Atlas Copco" />
            </p>
            <Suspense fallback={<StatsSkeleton />}>
              <CatalogueStats />
            </Suspense>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-lg border border-line/80 bg-canvas p-6 shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-md bg-navy text-white">
                  <FileUp className="size-5" strokeWidth={1.5} aria-hidden />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-ink">Có sẵn danh sách mã?</h2>
                  <p className="text-sm text-muted">Đặt nhiều mã trong một lần gửi.</p>
                </div>
              </div>
              <ol className="mt-5 space-y-3">
                {[
                  ["Dán từ Excel hoặc tải lên CSV", "Mã sản phẩm và số lượng, mỗi dòng một mã."],
                  ["Đối chiếu danh mục tức thì", "Mã có trên web được nhận diện ngay."],
                  ["Nhận báo giá qua email", "Cả những mã chưa có trên web."],
                ].map(([title, detail], index) => (
                  <li key={title} className="flex gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-line-strong bg-page font-mono text-xs font-semibold text-ink">
                      {index + 1}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-ink">{title}</span>
                      <span className="block text-sm text-muted">{detail}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <ButtonLink href={routes.quickOrder} size="lg" className="mt-6 w-full">
                Đặt hàng nhanh
                <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden />
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-12 lg:py-16">
        <Suspense fallback={<CategoriesSkeleton />}>
          <Categories />
        </Suspense>
      </Container>

      <section className="border-y border-line/80 bg-page">
        <Container className="py-12 lg:py-16">
          <Suspense fallback={<ProductsSkeleton />}>
            <FeaturedProducts />
          </Suspense>
        </Container>
      </section>

      <Container className="py-12 lg:py-16">
        <Suspense fallback={<PartnersSkeleton />}>
          <Partners />
        </Suspense>
      </Container>

      <section className="bg-navy">
        <Container className="flex flex-col items-start justify-between gap-6 py-10 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-xl font-bold text-white sm:text-2xl">
              Cần báo giá cho nhiều mã cùng lúc?
            </h2>
            <p className="mt-2 max-w-xl text-slate-300">
              Gửi danh sách mã sản phẩm và số lượng, chúng tôi báo giá trong giờ làm việc.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink
              href={routes.quickOrder}
              size="lg"
              className="bg-white text-ink hover:bg-slate-100 active:bg-slate-200"
            >
              <FileUp className="size-4" strokeWidth={1.5} aria-hidden />
              Gửi danh sách mã
            </ButtonLink>
            <ButtonLink
              href={routes.contact}
              size="lg"
              className="border border-slate-600 bg-transparent shadow-none hover:bg-navy-hover"
            >
              Liên hệ tư vấn
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}

/** Real counts from the API — a buyer judging a supplier trusts a number more than an adjective. */
async function CatalogueStats() {
  await connection();
  const [products, categories, brands] = await Promise.all([
    listProducts({ size: 1 }),
    getCategories(),
    getBrands(),
  ]);
  const stats = [
    { value: products.totalItems, label: "sản phẩm" },
    { value: flattenCategories(categories).length, label: "danh mục" },
    { value: brands.length, label: "thương hiệu" },
  ];

  return (
    <dl className="mt-8 flex max-w-xl divide-x divide-line/80 rounded-lg border border-line/80 bg-canvas">
      {stats.map((stat) => (
        <div key={stat.label} className="flex-1 px-4 py-3">
          <dt className="text-xs text-muted">{stat.label}</dt>
          <dd className="font-mono text-xl font-semibold text-ink">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function StatsSkeleton() {
  return <Skeleton className="mt-8 h-16 max-w-xl" />;
}

/**
 * `Organization` on the home page, plus a `WebSite` with a `SearchAction` — the part number box is the thing
 * this site is for, and declaring it lets Google offer it directly in the result.
 */
async function StructuredData() {
  await connection();
  const company = await getCompany().catch(() => null);
  if (!company) return null;

  return (
    <>
      <JsonLd data={organizationJsonLd(company)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: company.shortName,
          url: env.siteUrl,
          inLanguage: "vi-VN",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${env.siteUrl}${routes.products}?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        }}
      />
    </>
  );
}

function SearchExample({ q }: { q: string }) {
  return (
    <Link
      href={routes.search(q)}
      className="rounded-md border border-line/80 bg-canvas px-2 py-0.5 font-mono text-xs text-body transition-colors hover:border-brand-300 hover:text-brand-800"
    >
      {q}
    </Link>
  );
}

async function Categories() {
  await connection();
  const categories = await getCategories();

  return (
    <>
      <SectionHeading
        title="Danh mục sản phẩm"
        description="Chọn nhóm thiết bị bạn đang cần."
        action={
          <Link
            href={routes.categories}
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            Xem tất cả
          </Link>
        }
        className="mb-6"
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((root) => (
          <li key={root.slug} className="rounded-lg border border-line/80 bg-page p-5 shadow-card">
            <h3 className="text-base font-semibold text-ink">
              <Link href={routes.category(root.slug)} className="hover:text-brand-700">
                {root.name}
              </Link>
            </h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {root.children.map((child) => (
                <li key={child.slug}>
                  <Link
                    href={routes.category(child.slug)}
                    className="inline-flex rounded-md border border-line/80 bg-canvas px-2.5 py-1 text-sm text-body transition-colors hover:border-brand-300 hover:text-brand-800"
                  >
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </>
  );
}

async function FeaturedProducts() {
  await connection();
  const result = await listProducts({ size: 8 });

  return (
    <>
      <SectionHeading
        title="Sản phẩm tiêu biểu"
        description="Những mã được hỏi nhiều nhất."
        action={
          <Link
            href={routes.products}
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            Tất cả sản phẩm
          </Link>
        }
        className="mb-6"
      />
      <ProductGrid products={result.items} />
    </>
  );
}

async function Partners() {
  await connection();
  const partners = await getPartners();
  if (partners.length === 0) return null;

  return (
    <>
      <SectionHeading
        title="Hãng chúng tôi phân phối"
        description="Hàng chính hãng, có chứng từ đầy đủ."
        className="mb-6"
      />
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {partners.map((partner) => (
          <li
            key={partner.slug}
            className="flex h-24 items-center justify-center rounded-lg border border-line/80 bg-page p-4 shadow-card grayscale transition hover:grayscale-0"
          >
            {partner.logoUrl ? (
              <span className="relative h-full w-full">
                <Image
                  src={partner.logoUrl}
                  alt={partner.name}
                  fill
                  sizes="200px"
                  className="object-contain"
                />
              </span>
            ) : (
              <span className="text-sm font-semibold text-body">{partner.name}</span>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

function CategoriesSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} className="h-40" />
      ))}
    </div>
  );
}

function ProductsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} className="h-64" />
      ))}
    </div>
  );
}

function PartnersSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" aria-hidden>
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-24" />
      ))}
    </div>
  );
}
