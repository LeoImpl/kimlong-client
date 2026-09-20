import { Suspense } from "react";
import { connection } from "next/server";
import { getBrands, getCategories, flattenCategories } from "@/lib/api/catalog";

/**
 * Phase 0 placeholder. It exists to prove the scaffold is wired to the real API: server-rendered, cached through
 * `use cache`, typed from the generated OpenAPI types. Phase 2 replaces it with the real home page.
 *
 * The API call sits behind `<Suspense>` and `connection()` on purpose. Without them Next prerenders the page at
 * build time, which makes every build — CI, Docker image — depend on a reachable API, so a backend blip would
 * fail a deploy. `connection()` stops prerendering, the shell stays static, and the data is fetched on the first
 * request and then served from the cache (`cacheLife("days")`) for everyone after that.
 */
export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-sm font-medium text-blue-700">Phase 0 · scaffold</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        Kim Long — nền tảng thiết bị công nghiệp
      </h1>
      <p className="mt-3 text-slate-600">
        Trang tạm thời. Dữ liệu dưới đây lấy trực tiếp từ platform API, render phía server.
      </p>

      <Suspense fallback={<CatalogueSkeleton />}>
        <CatalogueSummary />
      </Suspense>
    </main>
  );
}

async function CatalogueSummary() {
  // Stops prerendering: everything below runs at request time, not during `next build`.
  await connection();
  const [categories, brands] = await Promise.all([getCategories(), getBrands()]);
  const allCategories = flattenCategories(categories);

  return (
    <>
      <dl className="mt-10 grid grid-cols-2 gap-4">
        <Stat label="Danh mục" value={allCategories.length} />
        <Stat label="Thương hiệu" value={brands.length} />
      </dl>

      <h2 className="mt-10 text-sm font-medium text-slate-900">Cây danh mục</h2>
      <ul className="mt-3 space-y-1 text-sm text-slate-700">
        {categories.map((root) => (
          <li key={root.slug}>
            {root.name}
            {root.children.length > 0 && (
              <ul className="mt-1 ml-4 space-y-1 text-slate-600">
                {root.children.map((child) => (
                  <li key={child.slug}>{child.name}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function CatalogueSkeleton() {
  return (
    <div className="mt-10 animate-pulse space-y-4" aria-hidden>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-20 rounded-lg bg-slate-100" />
        <div className="h-20 rounded-lg bg-slate-100" />
      </div>
      <div className="h-4 w-32 rounded bg-slate-100" />
      <div className="h-24 rounded bg-slate-100" />
    </div>
  );
}
