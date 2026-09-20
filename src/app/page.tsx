import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { SearchBox } from "@/components/layout/SearchBox";
import { ButtonLink } from "@/components/ui/Button";
import { Container, SectionHeading } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Feedback";
import { getCategories, listProducts } from "@/lib/api/catalog";
import { getPartners } from "@/lib/api/company";
import { routes } from "@/lib/routes";

/**
 * The home page is not where the money is — most visitors arrive on a product page from Google — but it is where
 * a buyer who was sent a link decides whether this supplier is credible. So: search first, then what we sell,
 * then who we represent.
 *
 * The hero is static HTML in the build; everything that needs the API streams in behind its own boundary.
 */
export default function Home() {
  return (
    <>
      <section className="border-b border-line bg-linear-to-b from-surface to-page">
        <Container className="py-12 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-balance text-ink sm:text-4xl lg:text-5xl">
              Phụ tùng máy nén khí &amp; thiết bị tự động hóa chính hãng
            </h1>
            <p className="mt-4 text-lg text-balance text-body">
              Tra cứu theo mã sản phẩm hoặc tên thiết bị. Báo giá nhanh, giao hàng toàn quốc.
            </p>
            <div className="mt-8">
              <SearchBox size="lg" />
            </div>
            <p className="mt-3 text-sm text-muted">
              Ví dụ: <SearchExample q="1613900100" />, <SearchExample q="DSBC-32-50" />,{" "}
              <SearchExample q="lọc dầu Atlas Copco" />
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-12 lg:py-16">
        <Suspense fallback={<CategoriesSkeleton />}>
          <Categories />
        </Suspense>
      </Container>

      <section className="border-y border-line bg-surface">
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

      <section className="border-t border-line bg-brand-700">
        <Container className="flex flex-col items-center gap-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-white">Cần báo giá cho nhiều mã cùng lúc?</h2>
          <p className="max-w-xl text-brand-100">
            Gửi danh sách mã sản phẩm và số lượng, chúng tôi báo giá trong giờ làm việc.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <ButtonLink href={routes.quote} variant="secondary" size="lg">
              Yêu cầu báo giá
            </ButtonLink>
            <ButtonLink
              href={routes.contact}
              size="lg"
              className="bg-brand-900 hover:bg-brand-900/80"
            >
              Liên hệ tư vấn
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}

function SearchExample({ q }: { q: string }) {
  return (
    <Link href={routes.search(q)} className="text-brand-700 hover:underline">
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
          <li key={root.slug} className="rounded-lg border border-line bg-page p-5">
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
                    className="inline-flex rounded-full border border-line px-3 py-1 text-sm text-body hover:border-brand-300 hover:text-brand-700"
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
            className="flex h-24 items-center justify-center rounded-lg border border-line bg-page p-4"
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
