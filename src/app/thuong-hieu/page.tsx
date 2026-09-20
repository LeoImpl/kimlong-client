import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { connection } from "next/server";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Feedback";
import { getBrands } from "@/lib/api/catalog";
import { routes } from "@/lib/routes";

/** All brands in the catalogue. A buyer often knows the make before anything else — "Festo", "Atlas Copco". */
export const metadata: Metadata = {
  title: "Thương hiệu",
  description:
    "Phụ tùng và thiết bị chính hãng: Atlas Copco, Ingersoll Rand, CompAir, Kobelco, Fusheng, Festo, IFM, " +
    "B&R, Lenze, MAC Valves.",
  alternates: { canonical: routes.brands },
};

export default function BrandsPage() {
  return (
    <Container className="py-6 lg:py-10">
      <Breadcrumb items={[{ name: "Trang chủ", href: routes.home }, { name: "Thương hiệu" }]} />
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Thương hiệu</h1>
      <p className="mt-2 max-w-3xl text-body">
        Chúng tôi cung cấp phụ tùng và thiết bị chính hãng của các hãng dưới đây. Chọn một hãng để
        xem sản phẩm.
      </p>

      <Suspense fallback={<GridSkeleton />}>
        <BrandGrid />
      </Suspense>
    </Container>
  );
}

async function BrandGrid() {
  await connection();
  const brands = await getBrands();

  return (
    <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {brands.map((brand) => (
        <li key={brand.slug}>
          <Link
            href={routes.brand(brand.slug)}
            className="flex h-full flex-col items-center gap-3 rounded-lg border border-line bg-page p-5 text-center hover:border-brand-300 hover:shadow-sm"
          >
            <div className="relative flex h-12 w-full items-center justify-center">
              {brand.logoUrl ? (
                <Image src={brand.logoUrl} alt="" fill sizes="200px" className="object-contain" />
              ) : (
                <span className="text-lg font-semibold text-line-strong" aria-hidden>
                  {brand.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-ink">{brand.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function GridSkeleton() {
  return (
    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} className="h-32" />
      ))}
    </div>
  );
}
