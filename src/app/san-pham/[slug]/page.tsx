import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { AddToQuote } from "@/components/quote/AddToQuote";
import { QuickQuoteForm } from "@/components/quote/QuickQuoteForm";
import { ProductGallery } from "@/components/catalog/ProductGallery";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { VariantTable } from "@/components/catalog/VariantTable";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container, SectionHeading } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Feedback";
import { PartNumber } from "@/components/ui/PartNumber";
import { Price } from "@/components/ui/Price";
import { SpecList } from "@/components/ui/Table";
import { getProduct, listProducts } from "@/lib/api/catalog";
import { getCompany, primaryHotline } from "@/lib/api/company";
import type { ProductDetail } from "@/lib/api/types";
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

  return {
    title: product.name,
    description: description(product),
    alternates: { canonical: routes.product(product.slug) },
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

  return (
    <Container className="py-6 lg:py-10">
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

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          {product.brand && (
            <Link
              href={routes.brand(product.brand.slug)}
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              {product.brand.name}
            </Link>
          )}
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {product.name}
          </h1>
          {product.summary && <p className="mt-3 text-body">{product.summary}</p>}

          {product.variants.length > 0 && (
            <div className="mt-5 rounded-lg border border-line bg-surface p-4">
              <p className="text-xs font-medium text-muted uppercase">
                {product.variants.length > 1
                  ? `${product.variants.length} mã sản phẩm`
                  : "Mã sản phẩm"}
              </p>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                {product.variants.slice(0, 6).map((variant) => (
                  <li key={variant.partNumber}>
                    <PartNumber value={variant.partNumber} />
                  </li>
                ))}
                {product.variants.length > 6 && (
                  <li className="self-center text-sm text-muted">
                    <a href="#ma-san-pham" className="hover:text-brand-700 hover:underline">
                      +{product.variants.length - 6} mã khác
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-sm text-muted">Giá:</span>
            <Price price={product.price} className="text-xl" />
          </div>

          {/* Two ways in, on purpose: the basket for a buyer collecting a service kit, the quick form for the
              visitor after one part who would otherwise just close the tab. */}
          <AddToQuote
            product={{
              slug: product.slug,
              name: product.name,
              imageUrl: product.images[0]?.url ?? null,
            }}
            partNumbers={partNumbers}
            className="mt-5"
          />

          <div className="mt-4">
            <Suspense fallback={<Skeleton className="h-12 w-56" />}>
              <QuickQuote product={product} partNumbers={partNumbers} />
            </Suspense>
          </div>

          {product.highlights.length > 0 && (
            <ul className="mt-6 space-y-2">
              {product.highlights.map((highlight) => (
                <li key={highlight} className="flex gap-2 text-sm text-body">
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-700"
                    aria-hidden
                  />
                  {highlight}
                </li>
              ))}
            </ul>
          )}

          <CommercialTerms product={product} />
        </div>
      </div>

      {product.variants.length > 0 && (
        <section id="ma-san-pham" className="mt-12 scroll-mt-20">
          <SectionHeading
            title="Mã sản phẩm"
            description="Mã sản phẩm được tra cứu không phân biệt hoa thường và dấu gạch."
            className="mb-4"
          />
          <VariantTable variants={product.variants} />
        </section>
      )}

      {product.specifications.length > 0 && (
        <section className="mt-12">
          <SectionHeading title="Thông số kỹ thuật" className="mb-4" />
          <SpecList items={product.specifications} className="max-w-3xl" />
        </section>
      )}

      {product.description && (
        <section className="mt-12 max-w-3xl">
          <SectionHeading title="Mô tả" className="mb-4" />
          <div className="space-y-3 text-body">
            {product.description.split(/\n{2,}/).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </section>
      )}

      {product.documents.length > 0 && (
        <section className="mt-12 max-w-3xl">
          <SectionHeading title="Tài liệu kỹ thuật" className="mb-4" />
          <ul className="space-y-2">
            {product.documents.map((document) => (
              <li key={document.url}>
                <a
                  href={document.url}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-2 text-sm text-brand-700 hover:underline"
                >
                  <DocumentIcon />
                  {document.filename}
                </a>
              </li>
            ))}
          </ul>
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
  return <SpecList items={terms} className="mt-6" />;
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

function DocumentIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M9 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5L9 1.5Z" />
      <path d="M9 1.5v4h4" />
    </svg>
  );
}
