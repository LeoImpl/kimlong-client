import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  ArrowDown,
  BadgeCheck,
  Check,
  FileCheck2,
  FileDown,
  Globe2,
  Layers,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { AddToQuote } from "@/components/quote/AddToQuote";
import { QuickQuoteForm } from "@/components/quote/QuickQuoteForm";
import { ProductGallery } from "@/components/catalog/ProductGallery";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { VariantOrderMatrix } from "@/components/catalog/VariantOrderMatrix";
import { Badge } from "@/components/ui/Badge";
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
        <div className="animate-fade-up lg:col-span-5">
          <ProductGallery images={product.images} name={product.name} />
        </div>

        <div className="animate-fade-up [animation-delay:100ms] lg:col-span-7">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold tracking-wide uppercase">
            {product.brand && (
              <Link
                href={routes.brand(product.brand.slug)}
                className="text-brand-700 hover:underline"
              >
                {product.brand.name}
              </Link>
            )}
            {product.brand && category && <span className="text-line-strong">/</span>}
            {category && (
              <Link href={routes.category(category.slug)} className="text-muted hover:text-ink">
                {category.name}
              </Link>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-balance text-ink sm:text-3xl">
            {product.name}
          </h1>
          {product.summary && <p className="mt-3 max-w-2xl text-body">{product.summary}</p>}

          <TrustBadges product={product} />

          <Card className="relative mt-6 overflow-hidden p-5">
            <span
              className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-brand-700 via-brand-500 to-cyan-accent"
              aria-hidden
            />
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">Đơn giá</p>
                <Price
                  price={product.price}
                  className="text-gradient-ink mt-1 block text-3xl font-bold"
                />
              </div>
              <p className="max-w-64 text-xs leading-relaxed text-muted">
                Giá sỉ theo số lượng và thời điểm đặt hàng. Gửi yêu cầu để nhận báo giá chính xác
                qua email.
              </p>
            </div>

            {product.variants.length > 0 && (
              <div className="mt-5 border-t border-line/80 pt-4">
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                  {product.variants.length > 1
                    ? `${product.variants.length} mã sản phẩm`
                    : "Mã sản phẩm"}
                </p>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                  {product.variants.slice(0, 6).map((variant) => (
                    <li key={variant.partNumber}>
                      <PartNumber value={variant.partNumber} />
                    </li>
                  ))}
                  {product.variants.length > 6 && (
                    <li className="self-center text-sm text-muted">
                      <a href="#dat-hang" className="hover:text-brand-700 hover:underline">
                        +{product.variants.length - 6} mã khác
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Two ways in, on purpose: the matrix for a buyer collecting a service kit, the quick form for the
                visitor after one part who would otherwise just close the tab. */}
            <div className="mt-5 flex flex-wrap items-start gap-3">
              {product.variants.length > 0 ? (
                <ButtonLink href="#dat-hang" size="lg">
                  <ArrowDown className="size-4" strokeWidth={1.5} aria-hidden />
                  Chọn mã &amp; số lượng
                </ButtonLink>
              ) : (
                <AddToQuote product={basketProduct} />
              )}
              <Suspense fallback={<Skeleton className="h-12 w-44" />}>
                <QuickQuote product={product} partNumbers={partNumbers} />
              </Suspense>
            </div>
          </Card>

          {product.documents.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {product.documents.map((document) => (
                <li key={document.url}>
                  <a
                    href={document.url}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-line/80 bg-page px-3 text-sm font-medium text-ink shadow-card transition-colors hover:bg-surface"
                  >
                    <FileDown className="size-4 text-brand-700" strokeWidth={1.5} aria-hidden />
                    Spec sheet
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
                <li key={highlight} className="flex gap-2.5 text-sm text-body">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-success"
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
        <section id="dat-hang" className="reveal mt-12 scroll-mt-24">
          <SectionHeading
            title="Đặt hàng theo mã"
            description="Nhập số lượng cho từng mã — Tab hoặc Enter để sang mã kế tiếp. Mã được tra cứu không phân biệt hoa thường và dấu gạch."
            className="mb-4"
          />
          <VariantOrderMatrix product={basketProduct} variants={product.variants} />
        </section>
      )}

      <div className="mt-12 grid gap-8 lg:grid-cols-12">
        {product.specifications.length > 0 && (
          <section className="reveal lg:col-span-7">
            <SectionHeading title="Thông số kỹ thuật" className="mb-4" />
            <Card className="px-4 py-1">
              <SpecList items={product.specifications} className="border-y-0" />
            </Card>
          </section>
        )}
        <CommercialTerms product={product} />
      </div>

      {product.description && (
        <section className="mt-12 max-w-3xl">
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
 * The facts a purchaser checks before asking for a price, as badges under the name. Only what the catalogue
 * actually records is shown — no invented stock levels or minimum order quantities.
 */
function TrustBadges({ product }: { product: ProductDetail }) {
  const { commercial } = product;
  const badges: { icon: React.ReactNode; text: string; tone: "neutral" | "success" | "brand" }[] =
    [];
  const icon = { strokeWidth: 1.5, "aria-hidden": true } as const;

  if (product.variants.length > 1) {
    badges.push({
      icon: <Layers {...icon} />,
      text: `${product.variants.length} mã`,
      tone: "neutral",
    });
  }
  if (commercial.condition) {
    badges.push({ icon: <BadgeCheck {...icon} />, text: commercial.condition, tone: "success" });
  }
  if (commercial.warranty) {
    badges.push({
      icon: <ShieldCheck {...icon} />,
      text: `Bảo hành: ${commercial.warranty}`,
      tone: "neutral",
    });
  }
  if (commercial.origin) {
    badges.push({
      icon: <Globe2 {...icon} />,
      text: `Xuất xứ: ${commercial.origin}`,
      tone: "neutral",
    });
  }
  if (commercial.documents) {
    badges.push({ icon: <FileCheck2 {...icon} />, text: commercial.documents, tone: "neutral" });
  }
  if (commercial.delivery) {
    badges.push({ icon: <Truck {...icon} />, text: commercial.delivery, tone: "brand" });
  }

  if (badges.length === 0) return null;
  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {badges.map((badge) => (
        <li key={badge.text}>
          <Badge tone={badge.tone} className="py-1">
            {badge.icon}
            {badge.text}
          </Badge>
        </li>
      ))}
    </ul>
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

function CommercialTerms({ product }: { product: ProductDetail }) {
  const terms = [
    { name: "Xuất xứ", value: product.commercial.origin },
    { name: "Bảo hành", value: product.commercial.warranty },
    { name: "Tình trạng", value: product.commercial.condition },
    { name: "Chứng từ", value: product.commercial.documents },
    { name: "Giao hàng", value: product.commercial.delivery },
  ].filter((term): term is { name: string; value: string } => Boolean(term.value));

  if (terms.length === 0) return null;
  return (
    <section className="reveal lg:col-span-5">
      <SectionHeading title="Điều kiện thương mại" className="mb-4" />
      <Card className="px-4 py-1">
        <SpecList items={terms} className="border-y-0" />
      </Card>
    </section>
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
      <SectionHeading title="Sản phẩm cùng danh mục" className="mb-4" />
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
