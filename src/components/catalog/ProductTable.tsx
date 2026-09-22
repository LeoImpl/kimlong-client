import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PartNumber } from "@/components/ui/PartNumber";
import { Price } from "@/components/ui/Price";
import type { ProductSummary } from "@/lib/api/types";
import { routes } from "@/lib/routes";
import { ProductImage } from "./ProductImage";

/**
 * The dense view of a listing: one row per product, part numbers in their own column. A purchaser comparing
 * twenty filters reads down a column; cards make them scan a grid instead.
 */
export function ProductTable({ products }: { products: ProductSummary[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line/80 bg-page shadow-card">
      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">Danh sách sản phẩm</caption>
          <thead>
            <tr className="bg-surface text-left text-xs font-semibold tracking-wide whitespace-nowrap text-muted uppercase">
              <th scope="col" className="border-b border-line px-4 py-2.5">
                Sản phẩm
              </th>
              <th scope="col" className="border-b border-line px-3 py-2.5">
                Hãng
              </th>
              <th scope="col" className="border-b border-line px-3 py-2.5">
                Mã sản phẩm
              </th>
              <th scope="col" className="border-b border-line px-3 py-2.5 text-right">
                Số mã
              </th>
              <th scope="col" className="border-b border-line px-3 py-2.5 text-right">
                Đơn giá
              </th>
              <th scope="col" className="w-10 border-b border-line px-3 py-2.5">
                <span className="sr-only">Xem</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const extra = product.variantCount - product.partNumbers.length;
              return (
                <tr key={product.slug} className="group transition-colors hover:bg-slate-50/80">
                  <td className="border-b border-line/80 px-4 py-2.5">
                    <div className="flex min-w-60 items-center gap-3">
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-md border border-line/80 bg-page">
                        <ProductImage src={product.imageUrl} alt="" sizes="44px" className="p-1" />
                      </div>
                      <Link
                        href={routes.product(product.slug)}
                        className="font-semibold text-ink hover:text-brand-700"
                      >
                        {product.name}
                      </Link>
                    </div>
                  </td>
                  <td className="border-b border-line/80 px-3 py-2.5 text-xs font-medium whitespace-nowrap text-muted uppercase">
                    {product.brand?.name ?? "—"}
                  </td>
                  <td className="border-b border-line/80 px-3 py-2.5">
                    <div className="flex max-w-80 flex-wrap gap-x-3 gap-y-0.5">
                      {product.partNumbers.slice(0, 3).map((partNumber) => (
                        <PartNumber
                          key={partNumber}
                          value={partNumber}
                          copyable={false}
                          className="text-xs"
                        />
                      ))}
                      {extra > 0 && <span className="font-mono text-xs text-muted">+{extra}</span>}
                    </div>
                  </td>
                  <td className="border-b border-line/80 px-3 py-2.5 text-right font-mono text-xs text-body">
                    {product.variantCount}
                  </td>
                  <td className="border-b border-line/80 px-3 py-2.5 text-right whitespace-nowrap">
                    <Price price={product.price} className="text-sm" />
                  </td>
                  <td className="border-b border-line/80 px-3 py-2.5">
                    <Link
                      href={routes.product(product.slug)}
                      tabIndex={-1}
                      aria-hidden
                      className="flex size-7 items-center justify-center rounded-md text-muted transition-colors group-hover:bg-page group-hover:text-brand-700"
                    >
                      <ArrowUpRight className="size-4" strokeWidth={1.5} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
