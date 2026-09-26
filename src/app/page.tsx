import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileUp,
  Loader2,
  Truck,
  Wrench,
} from "lucide-react";
import { connection } from "next/server";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { BrandMarquee } from "@/components/catalog/BrandMarquee";
import { categoryIcon } from "@/components/catalog/categoryStyle";
import { CountUp } from "@/components/motion/CountUp";
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

      {/* The page's one orchestrated moment: headline, plate and quick-order panel arrive in sequence. */}
      <section className="bg-linear-to-b from-action-50 to-canvas">
        <Container className="grid gap-10 py-10 sm:py-14 lg:grid-cols-12 lg:gap-12 lg:py-16">
          <div className="lg:col-span-7">
            <h1 className="max-w-3xl animate-rise text-[2.5rem] leading-[1.02] text-balance sm:text-[3.75rem]">
              Phụ tùng máy nén khí và thiết bị tự động hóa chính hãng
            </h1>
            <p className="mt-4 max-w-xl animate-rise text-lg text-body [animation-delay:80ms]">
              Nhập mã in trên nhãn thiết bị để tìm đúng sản phẩm và nhận báo giá sỉ. Giao hàng toàn
              quốc.
            </p>

            {/* The nameplate: the site's one bold device, holding the one thing it is for. */}
            <div className="plate mt-8 animate-rise px-5 pt-6 pb-5 [animation-delay:160ms] sm:px-8 sm:pt-7 sm:pb-7">
              <p className="text-[16px] font-medium text-ink" aria-hidden>
                Mã sản phẩm, part number hoặc hãng
              </p>
              <SearchBox size="lg" placeholder="Ví dụ 1613900100" className="mt-2" />
              <p className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-muted">
                Thử:
                <SearchExample q="1613900100" />
                <SearchExample q="DSBC-32-50" />
                <SearchExample q="lọc dầu Atlas Copco" />
              </p>
              <Suspense fallback={<StatsSkeleton />}>
                <CatalogueStats />
              </Suspense>
            </div>
          </div>

          <aside
            className="animate-rise self-end [animation-delay:260ms] lg:col-span-5"
            aria-labelledby="quick-order-heading"
          >
            <div className="rounded-lg border border-line bg-page p-5 shadow-[0_12px_32px_-16px_rgb(31_90_171/0.35)] sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-action-50 text-action-600">
                  <FileUp className="size-5" strokeWidth={1.5} aria-hidden />
                </span>
                <div>
                  <h2 id="quick-order-heading" className="text-2xl">
                    Có sẵn danh sách mã?
                  </h2>
                  <p className="mt-1 text-body">
                    Dán từ Excel hoặc tải lên CSV. Mã có trên web được nhận diện ngay, mã chưa có
                    thì bộ phận kinh doanh kiểm tra và báo giá qua email.
                  </p>
                </div>
              </div>

              {/* A sample of what the lookup shows, played once as the page arrives, so the promise is concrete
                  before the click. */}
              <table className="mt-5 w-full text-sm" aria-label="Ví dụ kết quả đối chiếu mã">
                <thead>
                  <tr className="border-b border-line text-left text-[14px] text-muted">
                    <th scope="col" className="py-1.5 font-medium">
                      Mã
                    </th>
                    <th scope="col" className="py-1.5 text-right font-medium">
                      SL
                    </th>
                    <th scope="col" className="py-1.5 pl-4 font-medium">
                      Kết quả
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <DemoRow code="1613900100" quantity={2} at="0.9s" found>
                    Lọc gió Atlas Copco
                  </DemoRow>
                  <DemoRow code="XYZ-4410" quantity={5} at="2.2s">
                    Kinh doanh kiểm tra
                  </DemoRow>
                </tbody>
              </table>

              <ButtonLink href={routes.quickOrder} size="lg" className="group mt-5 w-full">
                Đặt hàng nhanh theo mã
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </ButtonLink>
            </div>
          </aside>
        </Container>
      </section>

      <TrustBar />

      <section className="border-b border-line bg-page">
        <Container className="py-12 lg:py-16">
          <Suspense fallback={<CategoriesSkeleton />}>
            <Categories />
          </Suspense>
        </Container>
      </section>

      <Container className="py-12 lg:py-16">
        <Suspense fallback={<ProductsSkeleton />}>
          <FeaturedProducts />
        </Suspense>
      </Container>

      <Container className="pb-16">
        <Suspense fallback={<PartnersSkeleton />}>
          <Partners />
        </Suspense>
      </Container>

      <section className="bg-action-700">
        <Container className="reveal flex flex-col items-start justify-between gap-6 py-12 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-[2rem] leading-tight text-white">
              Cần báo giá cho nhiều mã cùng lúc?
            </h2>
            <p className="mt-2 max-w-xl text-lg text-action-100">
              Gửi danh sách mã và số lượng, bộ phận kinh doanh báo giá trong giờ làm việc.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink
              href={routes.quickOrder}
              size="lg"
              className="bg-page text-action-700 hover:bg-action-50"
            >
              <FileUp className="size-4" strokeWidth={1.5} aria-hidden />
              Gửi danh sách mã
            </ButtonLink>
            <ButtonLink
              href={routes.contact}
              size="lg"
              className="border border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              Liên hệ tư vấn
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}

/**
 * Real counts from the API, as the bottom row of the plate — a buyer judging a supplier trusts a number more
 * than an adjective, and on a rating plate the figures sit in exactly this kind of boxed row.
 */
async function CatalogueStats() {
  await connection();
  const [products, categories, brands] = await Promise.all([
    listProducts({ size: 1 }),
    getCategories(),
    getBrands(),
  ]);
  const stats = [
    { value: products.totalItems, label: "Sản phẩm" },
    { value: flattenCategories(categories).length, label: "Danh mục" },
    { value: brands.length, label: "Thương hiệu" },
  ];

  return (
    <dl className="plate-cells mt-6 [--cell:6rem]">
      {stats.map((stat) => (
        <div key={stat.label}>
          <dt className="text-[14px] text-muted">{stat.label}</dt>
          <dd className="font-display text-2xl font-semibold text-action-700">
            <CountUp value={stat.value} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function StatsSkeleton() {
  return <Skeleton className="mt-6 h-[66px] w-full" />;
}

/** One row of the lookup demo; see `.type-in` in globals.css for the timing. */
function DemoRow({
  code,
  quantity,
  at,
  found,
  children,
}: {
  code: string;
  quantity: number;
  at: string;
  found?: boolean;
  children: string;
}) {
  const timing = { "--chars": code.length, "--at": at } as React.CSSProperties;
  const Icon = found ? CheckCircle2 : Clock3;
  return (
    <tr className="border-b border-line" style={timing}>
      <td className="py-2 font-mono text-ink">
        <span className="type-in">{code}</span>
      </td>
      <td className="py-2 text-right font-mono">{quantity}</td>
      <td className="relative py-2 pl-4">
        <span
          className="resolve-pending absolute inset-y-0 left-4 flex items-center gap-1.5 text-muted"
          aria-hidden
        >
          <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
          Đang tra cứu…
        </span>
        <span
          className={`resolve-done inline-flex items-center gap-1.5 ${found ? "text-success" : "text-warning"}`}
        >
          <Icon className="size-4" strokeWidth={1.5} aria-hidden />
          {children}
        </span>
      </td>
    </tr>
  );
}

/**
 * What a buyer checks before trusting a new supplier, in one line under the hero. Only claims the business
 * already makes elsewhere on the site — no invented stock levels, delivery times or discounts.
 */
function TrustBar() {
  const items = [
    { icon: BadgeCheck, title: "Hàng chính hãng", detail: "Có chứng từ nguồn gốc" },
    { icon: Truck, title: "Giao hàng toàn quốc", detail: "Từ TP. Hồ Chí Minh" },
    { icon: Clock3, title: "Báo giá nhanh", detail: "Trong giờ làm việc" },
    { icon: Wrench, title: "Tư vấn kỹ thuật", detail: "Chọn đúng mã, đúng thông số" },
  ];
  return (
    <section aria-label="Cam kết" className="border-y border-line bg-page">
      <Container>
        <ul className="grid grid-cols-2 gap-px bg-line lg:grid-cols-4">
          {items.map(({ icon: Icon, title, detail }) => (
            <li key={title} className="group flex items-center gap-3 bg-page px-2 py-4 sm:px-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-action-50 text-action-600 transition-colors group-hover:bg-action-600 group-hover:text-white">
                <Icon className="size-5" strokeWidth={1.5} aria-hidden />
              </span>
              <span className="leading-tight">
                <span className="block font-semibold text-ink">{title}</span>
                <span className="block text-[14px] text-muted">{detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
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
      className="font-mono text-[14px] text-action-600 underline decoration-action-200 underline-offset-4 transition-colors hover:decoration-action-600"
    >
      {q}
    </Link>
  );
}

/**
 * The three families side by side, divided by rules rather than boxed as cards: they are one list read across,
 * and every type inside is a direct link — two clicks from the home page to a filtered listing.
 */
async function Categories() {
  await connection();
  const categories = await getCategories();

  return (
    <>
      <SectionHeading
        title="Danh mục sản phẩm"
        action={
          <Link
            href={routes.categories}
            className="group inline-flex items-center gap-1 text-[16px] font-medium text-action-600 hover:underline"
          >
            Xem tất cả danh mục
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              strokeWidth={1.5}
              aria-hidden
            />
          </Link>
        }
        className="mb-6"
      />
      <ul className="reveal grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3">
        {categories.map((root) => {
          const Icon = categoryIcon(root.slug);
          return (
            <li key={root.slug} className="bg-page p-5 sm:p-6">
              <span className="flex size-11 items-center justify-center rounded-md bg-action-50 text-action-600">
                <Icon className="size-6" strokeWidth={1.5} aria-hidden />
              </span>
              <h3 className="mt-3 text-2xl leading-tight">
                <Link href={routes.category(root.slug)} className="hover:underline">
                  {root.name}
                </Link>
              </h3>
              <ul className="mt-3 -mx-2">
                {root.children.map((child) => {
                  const ChildIcon = categoryIcon(child.slug, root.slug);
                  return (
                    <li key={child.slug}>
                      <Link
                        href={routes.category(child.slug)}
                        className="group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-body transition-colors hover:bg-action-50 hover:text-action-700"
                      >
                        <ChildIcon
                          className="size-4 text-muted group-hover:text-action-600"
                          strokeWidth={1.5}
                          aria-hidden
                        />
                        <span className="flex-1">{child.name}</span>
                        <ChevronRight
                          className="size-4 text-line-strong transition-transform group-hover:translate-x-0.5 group-hover:text-action-600"
                          strokeWidth={1.5}
                          aria-hidden
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
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
        action={
          <Link
            href={routes.products}
            className="group inline-flex items-center gap-1 text-[16px] font-medium text-action-600 hover:underline"
          >
            Tất cả {result.totalItems} sản phẩm
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              strokeWidth={1.5}
              aria-hidden
            />
          </Link>
        }
        className="mb-6"
      />
      <ProductGrid products={result.items} />
    </>
  );
}

/** The makers we distribute, as a moving strip of their logos (stored in the media module, served from S3). */
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
      <BrandMarquee brands={partners} />
    </>
  );
}

function CategoriesSkeleton() {
  return <Skeleton className="h-72 w-full" />;
}

function ProductsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} className="h-72" />
      ))}
    </div>
  );
}

function PartnersSkeleton() {
  return <Skeleton className="h-48 w-full" />;
}
