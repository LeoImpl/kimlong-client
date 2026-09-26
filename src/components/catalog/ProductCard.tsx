import Link from "next/link";
import { PartNumber } from "@/components/ui/PartNumber";
import { Price } from "@/components/ui/Price";
import type { ProductSummary } from "@/lib/api/types";
import { routes } from "@/lib/routes";
import { CardQuoteAction } from "./CardQuoteAction";
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
    <article className="group hover-lift relative flex w-full flex-col overflow-hidden rounded-lg border border-line bg-page">
      {/* The whole card is the name's link (its ::after covers the card); the photo needs no link of its own. */}
      <div className="relative aspect-4/3 overflow-hidden border-b border-line bg-surface">
        <ProductImage
          src={product.imageUrl}
          alt=""
          eager={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="p-3 mix-blend-multiply transition-transform duration-300 ease-out group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {product.brand && (
          <p className="text-[14px] font-medium text-brand-700">{product.brand.name}</p>
        )}
        <h3 className="mt-0.5 font-sans text-[16px] leading-snug font-medium">
          <Link
            href={routes.product(product.slug)}
            className="transition-colors after:absolute after:inset-0 group-hover:text-action-700"
          >
            {product.name}
          </Link>
        </h3>

        {/* The label strip: what the visitor compares against the tag on the part in their hand. */}
        {product.partNumbers.length > 0 && (
          <ul className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-dashed border-line pt-2.5">
            {product.partNumbers.slice(0, 3).map((partNumber) => (
              <li key={partNumber} className="min-w-0 break-all">
                <PartNumber value={partNumber} copyable={false} className="text-[14px]" />
              </li>
            ))}
            {extra > 0 && <li className="font-mono text-xs text-muted">+{extra}</li>}
          </ul>
        )}

        <div className="mt-auto flex items-center justify-between pt-3 pb-3 text-[14px]">
          <Price price={product.price} />
          {/* Unbranded supplies (capacitors, lamps) have no part numbers; "0 mã" reads as out of stock. */}
          {product.variantCount > 0 && (
            <span className="text-muted">{product.variantCount} mã</span>
          )}
        </div>
        <CardQuoteAction product={product} />
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: ProductSummary[] }) {
  return (
    <ul className="stagger grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.slug} className="flex" style={{ "--i": index } as React.CSSProperties}>
          <ProductCard product={product} priority={index < 4} />
        </li>
      ))}
    </ul>
  );
}
