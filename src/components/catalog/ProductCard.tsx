import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PartNumber } from "@/components/ui/PartNumber";
import { Price } from "@/components/ui/Price";
import type { ProductSummary } from "@/lib/api/types";
import { routes } from "@/lib/routes";
import { ProductImage } from "./ProductImage";

/**
 * One product in a listing. The part numbers are shown on the card on purpose: a visitor who searched for
 * "1613900100" needs to see that number on the card to know the result is theirs, before clicking anything.
 */
export function ProductCard({
  product,
  priority,
}: {
  product: ProductSummary;
  priority?: boolean;
}) {
  const extra = product.variantCount - product.partNumbers.length;

  return (
    <article className="lift group relative flex w-full flex-col overflow-hidden rounded-xl border border-line/80 bg-page shadow-card hover:border-brand-200">
      <span
        className="absolute inset-x-0 top-0 z-10 h-0.5 origin-left scale-x-0 bg-linear-to-r from-brand-600 to-cyan-accent transition-transform duration-500 group-hover:scale-x-100"
        aria-hidden
      />
      <Link
        href={routes.product(product.slug)}
        className="relative block aspect-4/3 overflow-hidden bg-linear-to-b from-page to-canvas"
      >
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          eager={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="p-4 transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-2 border-t border-line/80 p-4">
        {product.brand && (
          <p className="text-[11px] font-semibold tracking-wider text-brand-700 uppercase">
            {product.brand.name}
          </p>
        )}
        <h3 className="text-sm leading-snug font-semibold text-ink">
          <Link href={routes.product(product.slug)} className="hover:text-brand-700">
            {product.name}
          </Link>
        </h3>

        {product.partNumbers.length > 0 && (
          <ul className="flex flex-wrap items-center gap-1">
            {product.partNumbers.slice(0, 3).map((partNumber) => (
              <li key={partNumber} className="rounded bg-surface px-1.5 py-0.5">
                <PartNumber value={partNumber} copyable={false} className="text-[11px]" />
              </li>
            ))}
            {extra > 0 && <li className="px-1 font-mono text-[11px] text-muted">+{extra}</li>}
          </ul>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-dashed border-line pt-3">
          <Price price={product.price} className="text-sm" />
          <span className="flex items-center gap-1 font-mono text-[11px] text-muted transition-colors group-hover:text-brand-700">
            {product.variantCount} mã
            <ArrowRight
              className="size-3 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100"
              strokeWidth={1.5}
              aria-hidden
            />
          </span>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: ProductSummary[] }) {
  return (
    <ul className="stagger grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.slug} className="flex" style={{ "--i": index } as React.CSSProperties}>
          <ProductCard product={product} priority={index < 4} />
        </li>
      ))}
    </ul>
  );
}
