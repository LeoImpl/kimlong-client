import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listProducts } from "@/lib/api/catalog";
import type { CategoryNode } from "@/lib/api/types";
import { routes } from "@/lib/routes";
import { categoryIcon } from "./categoryStyle";
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
  const query = brand ? `?brand=${encodeURIComponent(brand)}` : "";

  if (available.length === 0) return null;

  return (
    <section aria-labelledby="type-picker-heading" className="mt-8">
      <h2 id="type-picker-heading" className="text-2xl">
        Chọn loại sản phẩm
      </h2>
      <ul className="stagger mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {available.map(({ type, result }, index) => {
          const Icon = categoryIcon(type.slug, family.slug);
          return (
            <li key={type.slug} style={{ "--i": index } as React.CSSProperties}>
              <Link
                href={`${routes.category(type.slug)}${query}`}
                className="group hover-lift flex h-full flex-col rounded-lg border border-line bg-page"
              >
                <div className="flex items-center gap-3 p-5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-action-50 text-action-600 transition-colors group-hover:bg-action-600 group-hover:text-white">
                    <Icon className="size-6" strokeWidth={1.5} aria-hidden />
                  </span>
                  <p className="min-w-0 flex-1 font-display text-2xl font-semibold text-ink">
                    {type.name}
                  </p>
                  <span className="font-mono text-sm text-muted">{result.totalItems}</span>
                </div>
                {/* A glimpse of what is inside, so the three types are told apart by their parts too. */}
                <div className="mt-auto grid grid-cols-4 gap-px border-y border-line bg-line">
                  {result.items.map((product) => (
                    <div key={product.slug} className="relative aspect-square bg-surface">
                      <ProductImage src={product.imageUrl} alt="" sizes="96px" className="p-1.5" />
                    </div>
                  ))}
                </div>
                <p className="flex items-center justify-between px-5 py-3 text-[15px] font-medium text-action-600">
                  Xem {result.totalItems} sản phẩm {type.name.toLowerCase()}
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
