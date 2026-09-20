import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Feedback";
import { getCategories } from "@/lib/api/catalog";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Danh mục sản phẩm",
  description:
    "Toàn bộ danh mục: phụ tùng máy nén khí (lọc dầu, lọc gió, lọc tách dầu), thiết bị tự động hóa " +
    "(van, xy lanh, cảm biến, biến tần, bộ điều khiển).",
  alternates: { canonical: routes.categories },
};

export default function CategoriesPage() {
  return (
    <Container className="py-6 lg:py-10">
      <Breadcrumb items={[{ name: "Trang chủ", href: routes.home }, { name: "Danh mục" }]} />
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        Danh mục sản phẩm
      </h1>

      <Suspense fallback={<TreeSkeleton />}>
        <CategoryTree />
      </Suspense>
    </Container>
  );
}

async function CategoryTree() {
  await connection();
  const categories = await getCategories();

  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((root) => (
        <section key={root.slug} className="rounded-lg border border-line bg-page p-5">
          <h2 className="text-base font-semibold text-ink">
            <Link href={routes.category(root.slug)} className="hover:text-brand-700">
              {root.name}
            </Link>
          </h2>
          {root.description && <p className="mt-1 text-sm text-body">{root.description}</p>}
          {root.children.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {root.children.map((child) => (
                <li key={child.slug}>
                  <Link
                    href={routes.category(child.slug)}
                    className="text-sm text-body hover:text-brand-700"
                  >
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

function TreeSkeleton() {
  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} className="h-48" />
      ))}
    </div>
  );
}
