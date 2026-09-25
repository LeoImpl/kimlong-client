import Image from "next/image";
import Link from "next/link";
import type { PartnerBrand } from "@/lib/api/types";
import { routes } from "@/lib/routes";

/**
 * The makers we distribute, as a strip of logos that drifts sideways. Each logo links to that brand's products,
 * so the strip is also a way in, not only a trust signal.
 *
 * CSS only, no JavaScript: the list is rendered twice and the track moves by exactly one copy's width, so the
 * loop has no seam. The copy is hidden from assistive tech and out of the Tab order — screen readers and
 * crawlers see each brand once. The strip stops while the pointer is on it or a logo has keyboard focus, so a
 * buyer can aim at a logo, and under `prefers-reduced-motion` it becomes a still, wrapping row.
 */
export function BrandMarquee({ brands }: { brands: PartnerBrand[] }) {
  // Roughly constant speed whatever the number of brands: about 3 seconds per logo.
  const duration = `${Math.max(brands.length, 6) * 3}s`;

  return (
    <div
      className="marquee group relative overflow-hidden rounded-lg border border-line bg-page py-5"
      style={{ "--marquee-duration": duration } as React.CSSProperties}
    >
      <div className="marquee-track flex w-max">
        <BrandList brands={brands} />
        <BrandList brands={brands} copy />
      </div>
    </div>
  );
}

function BrandList({ brands, copy = false }: { brands: PartnerBrand[]; copy?: boolean }) {
  return (
    <ul className="flex shrink-0 items-center gap-4 pr-4" aria-hidden={copy || undefined}>
      {brands.map((brand) => (
        <li key={brand.slug}>
          <Link
            href={routes.brand(brand.slug)}
            tabIndex={copy ? -1 : undefined}
            title={`Sản phẩm ${brand.name}`}
            className="flex h-20 w-44 items-center justify-center rounded-md border border-transparent px-5 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-action-200 hover:bg-action-50"
          >
            {brand.logoUrl ? (
              <span className="relative h-12 w-full">
                <Image
                  src={brand.logoUrl}
                  alt={copy ? "" : brand.name}
                  fill
                  sizes="176px"
                  // Lazy loading would leave blank slots sliding into view; the logos are a few KB each.
                  loading="eager"
                  className="object-contain"
                />
              </span>
            ) : (
              <span className="font-display text-xl font-semibold text-body">{brand.name}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
