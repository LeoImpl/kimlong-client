import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CheckCircle2, CircleDashed, FileUp } from "lucide-react";
import { connection } from "next/server";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { categoryStyle } from "@/components/catalog/categoryStyle";
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

      <section className="relative isolate overflow-hidden bg-navy">
        {/* Glow and blueprint grid: pure decoration, behind the content and hidden from assistive tech. */}
        <div className="absolute inset-0 -z-10" aria-hidden>
          <div className="absolute -top-40 -left-32 size-[520px] rounded-full bg-brand-600/40 blur-3xl" />
          <div className="absolute top-10 right-[-120px] size-[460px] rounded-full bg-cyan-500/25 blur-3xl" />
          <div className="absolute bottom-[-220px] left-1/3 size-[420px] rounded-full bg-brand-400/20 blur-3xl" />
          <div className="bg-blueprint bg-blueprint-fade absolute inset-0" />
        </div>

        <Container className="grid gap-12 py-14 lg:grid-cols-12 lg:py-20">
          <div className="lg:col-span-7">
            <p className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[11px] font-medium tracking-wider text-cyan-200 uppercase backdrop-blur">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping-slow rounded-full bg-emerald-400" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              Nhà cung cấp B2B · Phụ tùng công nghiệp
            </p>
            <h1 className="mt-5 animate-fade-up text-4xl font-bold tracking-tight text-balance text-white [animation-delay:80ms] sm:text-5xl">
              Phụ tùng máy nén khí &amp; <span className="text-gradient">thiết bị tự động hóa</span>{" "}
              chính hãng
            </h1>
            <p className="mt-5 max-w-xl animate-fade-up text-base text-balance text-slate-300 [animation-delay:160ms] sm:text-lg">
              Tra cứu theo mã sản phẩm, part number hoặc hãng. Báo giá sỉ theo số lượng, giao hàng
              toàn quốc.
            </p>
            <div className="mt-8 max-w-xl animate-fade-up rounded-lg bg-white/10 p-1.5 ring-1 ring-white/15 backdrop-blur [animation-delay:240ms]">
              <SearchBox size="lg" />
            </div>
            <p className="mt-4 flex animate-fade-up flex-wrap items-center gap-2 text-sm text-slate-400 [animation-delay:320ms]">
              Thử:
              <SearchExample q="1613900100" />
              <SearchExample q="DSBC-32-50" />
              <SearchExample q="lọc dầu Atlas Copco" />
            </p>
            <Suspense fallback={<StatsSkeleton />}>
              <CatalogueStats />
            </Suspense>
          </div>

          <div className="relative lg:col-span-5">
            <div className="animate-fade-up rounded-xl border border-white/15 bg-white/[0.07] p-6 shadow-2xl ring-1 ring-white/5 backdrop-blur-md [animation-delay:200ms]">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-lg bg-linear-to-br from-brand-500 to-cyan-500 text-white shadow-glow">
                  <FileUp className="size-5" strokeWidth={1.5} aria-hidden />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-white">Có sẵn danh sách mã?</h2>
                  <p className="text-sm text-slate-400">Đặt nhiều mã trong một lần gửi.</p>
                </div>
              </div>
              <ol className="mt-6 space-y-4">
                {[
                  ["Dán từ Excel hoặc tải lên CSV", "Mã sản phẩm và số lượng, mỗi dòng một mã."],
                  ["Đối chiếu danh mục tức thì", "Mã có trên web được nhận diện ngay."],
                  ["Nhận báo giá qua email", "Cả những mã chưa có trên web."],
                ].map(([title, detail], index) => (
                  <li key={title} className="flex gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-cyan-300/30 bg-cyan-400/10 font-mono text-xs font-semibold text-cyan-200">
                      {index + 1}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-white">{title}</span>
                      <span className="block text-sm text-slate-400">{detail}</span>
                    </span>
                  </li>
                ))}
              </ol>

              {/* A sample of what the lookup shows, so the promise is concrete before the click. */}
              <div className="mt-6 space-y-2 rounded-lg border border-white/10 bg-navy/60 p-3 font-mono text-xs">
                <p className="flex items-center justify-between gap-3">
                  <span className="text-slate-200">1613900100 × 2</span>
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <CheckCircle2 className="size-3.5" strokeWidth={1.5} aria-hidden />
                    Lọc gió Atlas Copco
                  </span>
                </p>
                <p className="flex items-center justify-between gap-3">
                  <span className="text-slate-200">XYZ-4410 × 5</span>
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <CircleDashed className="size-3.5" strokeWidth={1.5} aria-hidden />
                    Sales kiểm tra
                  </span>
                </p>
              </div>

              <ButtonLink
                href={routes.quickOrder}
                size="lg"
                className="mt-6 w-full bg-white bg-none text-ink shadow-glow hover:bg-slate-100"
              >
                Đặt hàng nhanh
                <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden />
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-14 lg:py-20">
        <Suspense fallback={<CategoriesSkeleton />}>
          <Categories />
        </Suspense>
      </Container>

      <section className="relative border-y border-line/80 bg-page">
        <div className="bg-dots absolute inset-0 opacity-60" aria-hidden />
        <Container className="relative py-14 lg:py-20">
          <Suspense fallback={<ProductsSkeleton />}>
            <FeaturedProducts />
          </Suspense>
        </Container>
      </section>

      <div className="py-14 lg:py-20">
        <Suspense fallback={<PartnersSkeleton />}>
          <Partners />
        </Suspense>
      </div>

      <section className="relative isolate overflow-hidden bg-linear-to-r from-navy via-brand-900 to-navy">
        <div className="absolute inset-0 -z-10" aria-hidden>
          <div className="bg-blueprint absolute inset-0 opacity-60" />
          <div className="absolute top-1/2 right-10 size-72 -translate-y-1/2 rounded-full bg-cyan-500/25 blur-3xl" />
        </div>
        <Container className="reveal flex flex-col items-start justify-between gap-6 py-14 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Cần báo giá cho <span className="text-gradient">nhiều mã</span> cùng lúc?
            </h2>
            <p className="mt-2 max-w-xl text-slate-300">
              Gửi danh sách mã sản phẩm và số lượng, chúng tôi báo giá trong giờ làm việc.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink
              href={routes.quickOrder}
              size="lg"
              className="bg-white bg-none text-ink shadow-glow hover:bg-slate-100"
            >
              <FileUp className="size-4" strokeWidth={1.5} aria-hidden />
              Gửi danh sách mã
            </ButtonLink>
            <ButtonLink
              href={routes.contact}
              size="lg"
              className="border border-white/25 bg-white/5 bg-none shadow-none backdrop-blur hover:bg-white/10"
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
    <dl className="mt-10 grid max-w-xl animate-fade-up grid-cols-3 gap-3 [animation-delay:400ms]">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 backdrop-blur"
        >
          <dt className="text-xs text-slate-400">{stat.label}</dt>
          <dd className="font-mono text-2xl font-semibold text-white">
            <CountUp value={stat.value} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function StatsSkeleton() {
  return <div className="mt-10 h-[74px] max-w-xl rounded-lg bg-white/5" aria-hidden />;
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
      className="rounded-md border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-xs text-slate-200 transition-colors hover:border-cyan-300/50 hover:bg-cyan-400/10 hover:text-white"
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
            className="group inline-flex items-center gap-1 text-sm font-semibold text-brand-700"
          >
            Xem tất cả
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              strokeWidth={1.5}
              aria-hidden
            />
          </Link>
        }
        className="reveal mb-8"
      />
      <ul className="stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((root, index) => {
          const style = categoryStyle(root.slug);
          const Icon = style.icon;
          return (
            <li
              key={root.slug}
              style={{ "--i": index } as React.CSSProperties}
              className="lift group relative overflow-hidden rounded-xl border border-line/80 bg-page p-6 shadow-card"
            >
              <span
                className={`absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-linear-to-r transition-transform duration-500 group-hover:scale-x-100 ${style.bar}`}
                aria-hidden
              />
              <div className="flex items-start justify-between gap-4">
                <span
                  className={`flex size-12 items-center justify-center rounded-lg ring-1 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${style.tile}`}
                >
                  <Icon className="size-6" strokeWidth={1.5} aria-hidden />
                </span>
                <span className="font-mono text-xs text-muted">
                  {String(root.children.length).padStart(2, "0")} nhóm
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">
                <Link href={routes.category(root.slug)} className="after:absolute after:inset-0">
                  {root.name}
                </Link>
              </h3>
              <ul className="relative z-10 mt-4 flex flex-wrap gap-2">
                {root.children.map((child) => (
                  <li key={child.slug}>
                    <Link
                      href={routes.category(child.slug)}
                      className={`inline-flex rounded-md border border-line/80 bg-canvas px-2.5 py-1 text-sm text-body transition-colors ${style.chip}`}
                    >
                      {child.name}
                    </Link>
                  </li>
                ))}
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
        description="Những mã được hỏi nhiều nhất."
        action={
          <Link
            href={routes.products}
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            Tất cả sản phẩm
          </Link>
        }
        className="reveal mb-8"
      />
      <ProductGrid products={result.items} />
    </>
  );
}

async function Partners() {
  await connection();
  const partners = await getPartners();
  if (partners.length === 0) return null;

  // Rendered twice for a seamless loop; the copy is hidden from assistive tech and crawlers see one list.
  const row = (hidden: boolean) =>
    partners.map((partner) => (
      <li
        key={`${partner.slug}-${hidden}`}
        aria-hidden={hidden || undefined}
        className="flex h-20 w-44 shrink-0 items-center justify-center rounded-lg border border-line/80 bg-page p-4 shadow-card grayscale transition duration-300 hover:scale-105 hover:grayscale-0"
      >
        {partner.logoUrl ? (
          <span className="relative h-full w-full">
            <Image
              src={partner.logoUrl}
              alt={hidden ? "" : partner.name}
              fill
              sizes="176px"
              className="object-contain"
            />
          </span>
        ) : (
          <span className="text-sm font-semibold text-body">{partner.name}</span>
        )}
      </li>
    ));

  return (
    <>
      <Container>
        <SectionHeading
          title="Hãng chúng tôi phân phối"
          description="Hàng chính hãng, có chứng từ đầy đủ."
          className="reveal mb-8"
        />
      </Container>
      <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
        <ul className="flex w-max animate-marquee gap-4 py-2 group-hover:[animation-play-state:paused]">
          {row(false)}
          {row(true)}
        </ul>
      </div>
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
    <div
      className="mx-auto grid max-w-7xl px-4 sm:px-6 lg:px-8 grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
      aria-hidden
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-24" />
      ))}
    </div>
  );
}
