import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArticleGrid } from "@/components/article/ArticleCard";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";
import { Pagination } from "@/components/ui/Pagination";
import { listArticles } from "@/lib/api/articles";
import { routes } from "@/lib/routes";

const description =
  "Hướng dẫn chọn và thay phụ tùng máy nén khí, cảm biến, van và xy lanh: khi nào cần thay, " +
  "cách đọc mã model, thông số kỹ thuật và lưu ý khi mua hàng chính hãng.";

export const metadata: Metadata = {
  title: "Bài viết kỹ thuật",
  description,
  alternates: { canonical: routes.articles },
  openGraph: {
    type: "website",
    title: "Bài viết kỹ thuật | Kim Long",
    description,
    url: routes.articles,
    siteName: "Kim Long",
    locale: "vi_VN",
  },
};

/**
 * The article index. Buyers mostly land on an article from Google, a question before a part number; this page
 * is for the ones who want to read on, and it gives crawlers one place that links every article.
 */
export default function ArticlesPage({ searchParams }: PageProps<"/bai-viet">) {
  return (
    <Container className="py-6 lg:py-10">
      <Breadcrumb items={[{ name: "Trang chủ", href: routes.home }, { name: "Bài viết" }]} />
      <h1 className="mt-4 text-[2rem] leading-tight sm:text-[2.5rem]">Bài viết kỹ thuật</h1>
      <p className="mt-3 max-w-3xl text-lg text-body">{description}</p>

      <Suspense fallback={<GridSkeleton />}>
        <Articles searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function Articles({
  searchParams,
}: {
  searchParams: PageProps<"/bai-viet">["searchParams"];
}) {
  await connection();
  const resolved = await searchParams;
  const raw = Array.isArray(resolved.page) ? resolved.page[0] : resolved.page;
  const page = Math.max(0, Number(raw ?? 0) || 0);
  const result = await listArticles(page);

  if (result.items.length === 0) {
    return (
      <EmptyState
        className="mt-8"
        title="Chưa có bài viết nào"
        description="Bài viết hướng dẫn chọn và thay phụ tùng sẽ sớm được đăng tại đây."
      />
    );
  }

  return (
    <div className="mt-8 space-y-10">
      <ArticleGrid articles={result.items} />
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        buildHref={(target) =>
          target === 0 ? routes.articles : `${routes.articles}?page=${target}`
        }
      />
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6" aria-hidden>
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-96" />
      ))}
    </div>
  );
}
