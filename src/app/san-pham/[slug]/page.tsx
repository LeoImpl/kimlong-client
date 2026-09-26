import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowDown, Check, FileDown } from "lucide-react";
import { AddToQuote } from "@/components/quote/AddToQuote";
import { QuickQuoteForm } from "@/components/quote/QuickQuoteForm";
import { ProductGallery } from "@/components/catalog/ProductGallery";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { VariantOrderMatrix } from "@/components/catalog/VariantOrderMatrix";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container, SectionHeading } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Feedback";
import { PartNumber } from "@/components/ui/PartNumber";
import { Price } from "@/components/ui/Price";
import { SpecList } from "@/components/ui/Table";
import { getProduct, listProducts } from "@/lib/api/catalog";
import { getCompany, primaryHotline } from "@/lib/api/company";
import type { ProductDetail } from "@/lib/api/types";
import { JsonLd, breadcrumbJsonLd, productJsonLd } from "@/lib/seo";
import { routes } from "@/lib/routes";

/**
 * The product page. Everything a visitor who googled a part number needs, in the order they need it: the photo
 * and the name, then the part numbers, then how to ask for a price.
 *
 * There is no `generateStaticParams` on purpose. It would make `next build` — and therefore every CI run and
 * image build — depend on a reachable API, which Phase 0 decided against. The page is rendered on the first
 * request instead and served from the cache afterwards (`getProduct` is `use cache`).
 */
export async function generateMetadata({
  params,
}: PageProps<"/san-pham/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Không tìm thấy sản phẩm" };

  const url = routes.product(product.slug);
  const summary = description(product);
  // Zalo and Facebook crawlers run no JavaScript, so everything a link preview shows has to be here. The image
  // is served from this origin (the media rewrite), which also keeps the API host out of the shared URL.
  const images = product.images.slice(0, 1).map((image) => ({ url: image.url, alt: product.name }));

  return {
    title: product.name,
    description: summary,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: `${product.name} | Kim Long`,
      description: summary,
      url,
      siteName: "Kim Long",
      locale: "vi_VN",
      images,
    },
    twitter: {
      card: images.length > 0 ? "summary_large_image" : "summary",
      title: product.name,
      description: summary,
      images,
    },
  };
}

/**
 * Reading `params` blocks prerendering, so the page itself is a static shell and the product streams into it.
 * A visitor on a slow connection sees the layout immediately instead of a white screen.
 */
export default function ProductPage(props: PageProps<"/san-pham/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <Product {...props} />
    </Suspense>
  );
}

async function Product({ params }: PageProps<"/san-pham/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const category = product.categories.at(-1);
  const partNumbers = product.variants.map((variant) => variant.partNumber);
  const basketProduct = {
    slug: product.slug,
    name: product.name,
    imageUrl: product.images[0]?.url ?? null,
  };

  return (
    <Container className="py-6 lg:py-8">
      <Suspense fallback={null}>
        <StructuredData product={product} />
      </Suspense>

      <Breadcrumb
        items={[
          { name: "Trang chủ", href: routes.home },
          ...product.categories.map((entry) => ({
            name: entry.name,
            href: routes.category(entry.slug),
          })),
          { name: product.name },
        ]}
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <ProductGallery images={product.images} name={product.name} />
        </div>

        <div className="lg:col-span-7">
          {/* The nameplate: the facts a buyer checks against the part in their hand, boxed like its rating plate. */}
          <div className="plate px-5 pt-6 pb-5 sm:px-8 sm:pt-8 sm:pb-7">
            <p className="flex flex-wrap items-center gap-x-2 text-[16px]">
              {product.brand && (
                <Link
                  href={routes.brand(product.brand.slug)}
                  className="font-medium text-action-600 hover:underline"
                >
                  {product.brand.name}
                </Link>
              )}
              {product.brand && category && (
                <span className="text-line-strong" aria-hidden>
                  /
                </span>
              )}
              {category && (
                <Link href={routes.category(category.slug)} className="text-muted hover:text-ink">
                  {category.name}
                </Link>
              )}
            </p>
            <h1 className="mt-1 text-[2rem] leading-[1.1] text-balance sm:text-[2.75rem]">
              {product.name}
            </h1>
            {product.summary && <p className="mt-3 max-w-2xl text-body">{product.summary}</p>}

            <PlateFields product={product} />

            {/* Two ways in, on purpose: the matrix for a buyer collecting a service kit, the quick form for the
                visitor after one part who would otherwise just close the tab. */}
            <div className="mt-6 flex flex-wrap items-start gap-3">
              {product.variants.length > 1 ? (
                <ButtonLink href="#dat-hang" size="lg">
                  <ArrowDown className="size-4" strokeWidth={1.5} aria-hidden />
                  Chọn mã và số lượng
                </ButtonLink>
              ) : product.variants.length === 1 ? (
                <ButtonLink href="#dat-hang" size="lg">
                  <ArrowDown className="size-4" strokeWidth={1.5} aria-hidden />
                  Nhập số lượng
                </ButtonLink>
              ) : (
                <AddToQuote product={basketProduct} />
              )}
              <Suspense fallback={<Skeleton className="h-12 w-44" />}>
                <QuickQuote product={product} partNumbers={partNumbers} />
              </Suspense>
            </div>
          </div>

          {product.documents.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {product.documents.map((document) => (
                <li key={document.url}>
                  <a
                    href={document.url}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-line-strong bg-page px-3 text-sm font-medium text-ink transition-colors hover:border-muted"
                  >
                    <FileDown className="size-4 text-brand-700" strokeWidth={1.5} aria-hidden />
                    Tài liệu kỹ thuật
                    <span className="max-w-48 truncate font-mono text-xs text-muted">
                      {document.filename}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}

          {product.highlights.length > 0 && (
            <ul className="mt-6 space-y-2">
              {product.highlights.map((highlight) => (
                <li key={highlight} className="flex gap-2.5 text-body">
                  <Check
                    className="mt-1 size-4 shrink-0 text-success"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  {highlight}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {product.variants.length > 0 && (
        <section id="dat-hang" className="mt-14 scroll-mt-24">
          <SectionHeading
            title="Đặt hàng theo mã"
            description="Nhập số lượng cho từng mã, rồi nhấn Tab hoặc Enter để sang mã kế tiếp."
            className="mb-4"
          />
          <VariantOrderMatrix product={basketProduct} variants={product.variants} />
        </section>
      )}

      {product.specifications.length > 0 && (
        <section className="mt-14 max-w-3xl">
          <SectionHeading title="Thông số kỹ thuật" className="mb-4" />
          <Card className="px-4 py-1">
            <SpecList items={product.specifications} className="border-y-0" />
          </Card>
        </section>
      )}

      {product.description && (
        <section className="mt-14 max-w-3xl">
          <SectionHeading title="Mô tả" className="mb-4" />
          <div className="space-y-3 leading-relaxed text-body">
            {product.description.split(/\n{2,}/).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </section>
      )}

      {category && (
        <Suspense fallback={<RelatedSkeleton />}>
          <RelatedProducts categorySlug={category.slug} exclude={product.slug} />
        </Suspense>
      )}
    </Container>
  );
}

/**
 * The plate's fields: the part numbers first (what the visitor searched for), then the facts a purchaser checks
 * before asking for a price. Only what the catalogue records is shown — no invented stock levels or minimum
 * order quantities — and a missing fact is left out rather than shown blank.
 */
function PlateFields({ product }: { product: ProductDetail }) {
  const { commercial } = product;
  const facts = [
    { name: "Hãng", value: product.brand?.name },
    { name: "Tình trạng", value: commercial.condition },
    { name: "Bảo hành", value: commercial.warranty },
    { name: "Xuất xứ", value: commercial.origin },
    { name: "Chứng từ", value: commercial.documents },
    { name: "Giao hàng", value: commercial.delivery },
  ].filter((fact): fact is { name: string; value: string } => Boolean(fact.value));
  const shown = product.variants.slice(0, 6);
  const more = product.variants.length - shown.length;

  return (
    <dl className="plate-cells mt-6">
      {shown.length > 0 && (
        <div className="col-span-full">
          <dt className="text-[14px] text-muted">
            {product.variants.length > 1 ? `${product.variants.length} mã sản phẩm` : "Mã sản phẩm"}
          </dt>
          <dd className="mt-0.5 flex flex-wrap items-center gap-x-5 gap-y-1">
            {shown.map((variant) => (
              <PartNumber
                key={variant.partNumber}
                value={variant.partNumber}
                className="text-[18px]"
              />
            ))}
            {more > 0 && (
              <a href="#dat-hang" className="text-sm text-muted hover:text-ink hover:underline">
                +{more} mã khác
              </a>
            )}
          </dd>
        </div>
      )}
      {facts.map((fact) => (
        <div key={fact.name}>
          <dt className="text-[14px] text-muted">{fact.name}</dt>
          <dd className="mt-0.5 font-medium text-ink">{fact.value}</dd>
        </div>
      ))}
      <div className="col-span-full bg-surface">
        <dt className="text-[14px] text-muted">Đơn giá</dt>
        <dd className="mt-0.5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <Price price={product.price} className="font-display text-2xl font-semibold" />
          <span className="max-w-sm text-[14px] text-muted">
            Giá sỉ theo số lượng và thời điểm đặt hàng. Gửi yêu cầu để nhận báo giá chính xác qua
            email.
          </span>
        </dd>
      </div>
    </dl>
  );
}

/**
 * `Product` and `BreadcrumbList` for the search engines. Streamed with the rest of the page, so it is in the
 * HTML response — a crawler never has to run JavaScript to find it.
 */
async function StructuredData({ product }: { product: ProductDetail }) {
  await connection();
  const company = await getCompany().catch(() => null);

  return (
    <>
      <JsonLd data={productJsonLd(product, company)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Trang chủ", path: routes.home },
          ...product.categories.map((entry) => ({
            name: entry.name,
            path: routes.category(entry.slug),
          })),
          { name: product.name, path: routes.product(product.slug) },
        ])}
      />
    </>
  );
}

/** The quick form needs the hotline for its "we could not send it, call instead" message. */
async function QuickQuote({
  product,
  partNumbers,
}: {
  product: ProductDetail;
  partNumbers: string[];
}) {
  await connection();
  const company = await getCompany();
  return (
    <QuickQuoteForm
      product={{ slug: product.slug, name: product.name }}
      partNumbers={partNumbers}
      hotline={primaryHotline(company)?.phone ?? null}
    />
  );
}

/**
 * "Khách cũng xem": other products in the same category. Done with the existing search endpoint rather than a
 * new one — with a catalogue this size, same-category is as good a signal as anything an endpoint could compute.
 */
async function RelatedProducts({
  categorySlug,
  exclude,
}: {
  categorySlug: string;
  exclude: string;
}) {
  await connection();
  const result = await listProducts({ category: categorySlug, size: 5 });
  const related = result.items.filter((item) => item.slug !== exclude).slice(0, 4);
  if (related.length === 0) return null;

  return (
    <section className="mt-16">
      <SectionHeading title="Sản phẩm cùng loại" className="mb-4" />
      <ProductGrid products={related} />
    </section>
  );
}

function ProductSkeleton() {
  return (
    <Container className="py-6 lg:py-10" aria-hidden>
      <Skeleton className="h-4 w-80" />
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-64" />
        </div>
      </div>
    </Container>
  );
}

function RelatedSkeleton() {
  return (
    <div className="mt-16 space-y-4" aria-hidden>
      <Skeleton className="h-6 w-56" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-64" />
        ))}
      </div>
    </div>
  );
}

/** A description for search results and link previews: what it is, which part numbers, and who makes it. */
function description(product: ProductDetail): string {
  const partNumbers = product.variants.slice(0, 5).map((variant) => variant.partNumber);
  return [
    product.summary ?? product.name,
    product.brand ? `Hãng ${product.brand.name}.` : null,
    partNumbers.length > 0 ? `Mã: ${partNumbers.join(", ")}.` : null,
    "Liên hệ Kim Long để được báo giá và tư vấn kỹ thuật.",
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 300);
}
