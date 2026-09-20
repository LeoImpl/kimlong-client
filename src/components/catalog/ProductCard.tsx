import Link from "next/link";
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
    <article className="group flex w-full flex-col overflow-hidden rounded-lg border border-line bg-page transition-shadow hover:shadow-md">
      <Link href={routes.product(product.slug)} className="relative block aspect-4/3 bg-page">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          eager={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="p-3"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-2 border-t border-line p-4">
        {product.brand && (
          <p className="text-xs font-medium text-muted uppercase">{product.brand.name}</p>
        )}
        <h3 className="text-sm leading-snug font-medium text-ink">
          <Link href={routes.product(product.slug)} className="hover:text-brand-700">
            {product.name}
          </Link>
        </h3>

        {product.partNumbers.length > 0 && (
          <ul className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {product.partNumbers.slice(0, 3).map((partNumber) => (
              <li key={partNumber}>
                <PartNumber value={partNumber} copyable={false} className="text-xs" />
              </li>
            ))}
            {extra > 0 && <li className="text-xs text-muted">+{extra} mã khác</li>}
          </ul>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <Price price={product.price} className="text-sm" />
          <span className="text-xs text-muted">{product.variantCount} mã</span>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: ProductSummary[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.slug} className="flex">
          <ProductCard product={product} priority={index < 4} />
        </li>
      ))}
    </ul>
  );
}
