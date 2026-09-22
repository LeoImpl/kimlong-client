import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listProducts } from "@/lib/api/catalog";
import type { CategoryNode } from "@/lib/api/types";
import { routes } from "@/lib/routes";
import { categoryStyle, typeIcon } from "./categoryStyle";
import { ProductImage } from "./ProductImage";

/**
 * A family page ("Phụ tùng máy nén khí") asks which type the buyer wants instead of listing every product: oil
 * filters, air filters and oil separators are different parts, and one list of all three is what buyers read as
 * "mixed". Each card leads to that type's own page, which lists that type only. A brand filter carries over,
 * and a type with nothing for that brand is left out.
 */
export async function CategoryTypePicker({
  family,
  brand,
}: {
  family: CategoryNode;
  brand?: string;
}) {
  const types = await Promise.all(
    family.children.map(async (type) => ({
      type,
      result: await listProducts({ category: type.slug, brand, size: 4 }),
    })),
  );
  const available = types.filter((entry) => entry.result.totalItems > 0);
  const style = categoryStyle(family.slug);
  const query = brand ? `?brand=${encodeURIComponent(brand)}` : "";

  if (available.length === 0) return null;

  return (
    <section aria-labelledby="type-picker-heading" className="mt-8">
      <h2
        id="type-picker-heading"
        className="text-sm font-semibold tracking-wide text-muted uppercase"
      >
        Chọn loại sản phẩm
      </h2>
      <ul className="stagger mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {available.map(({ type, result }, index) => {
          const Icon = typeIcon(type.slug, style);
          return (
            <li key={type.slug} style={{ "--i": index } as React.CSSProperties}>
              <Link
                href={`${routes.category(type.slug)}${query}`}
                className="lift group relative flex h-full flex-col overflow-hidden rounded-xl border border-line/80 bg-page shadow-card hover:border-brand-200"
              >
                <span
                  className={`absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-linear-to-r transition-transform duration-500 group-hover:scale-x-100 ${style.bar}`}
                  aria-hidden
                />
                <div className="flex items-center gap-4 p-5">
                  <span
                    className={`flex size-12 shrink-0 items-center justify-center rounded-lg ring-1 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${style.tile}`}
                  >
                    <Icon className="size-6" strokeWidth={1.5} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold text-ink">{type.name}</p>
                    <p className="font-mono text-xs text-muted">{result.totalItems} sản phẩm</p>
                  </div>
                  <ArrowRight
                    className="size-5 text-muted transition-transform group-hover:translate-x-1 group-hover:text-brand-700"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </div>
                {/* A glimpse of what is inside, so the three types are told apart by their parts too. */}
                <div className="mt-auto grid grid-cols-4 gap-2 border-t border-line/80 bg-canvas p-3">
                  {result.items.map((product) => (
                    <div
                      key={product.slug}
                      className="relative aspect-square overflow-hidden rounded-md border border-line/80 bg-page"
                    >
                      <ProductImage src={product.imageUrl} alt="" sizes="80px" className="p-1" />
                    </div>
                  ))}
                </div>
                <p className="border-t border-line/80 px-5 py-3 text-sm font-semibold text-brand-700">
                  Xem {result.totalItems} sản phẩm {type.name.toLowerCase()}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
