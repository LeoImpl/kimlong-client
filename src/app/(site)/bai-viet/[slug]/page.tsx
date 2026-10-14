import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { CalendarDays, ClipboardList, Clock3, Phone } from "lucide-react";
import { ArticleBody, readingMinutes } from "@/components/article/ArticleBody";
import { ArticleGrid } from "@/components/article/ArticleCard";
import { ProductImage } from "@/components/catalog/ProductImage";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ButtonLink } from "@/components/ui/Button";
import { Container, SectionHeading } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Feedback";
import { PartNumber } from "@/components/ui/PartNumber";
import { getArticle, listArticles } from "@/lib/api/articles";
import { getProduct } from "@/lib/api/catalog";
import { formatPhone, getCompany, primaryHotline, telHref } from "@/lib/api/company";
import type { Article } from "@/lib/api/types";
import { formatDate } from "@/lib/date";
import { JsonLd, articleJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { routes } from "@/lib/routes";

export async function generateMetadata({
  params,
}: PageProps<"/bai-viet/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Không tìm thấy bài viết" };

  const url = routes.article(article.slug);
  // Zalo and Facebook crawlers run no JavaScript: the preview is whatever is here.
  const images = article.coverImageUrl ? [{ url: article.coverImageUrl, alt: article.title }] : [];
  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.summary,
      url,
      siteName: "Kim Long",
      locale: "vi_VN",
      publishedTime: article.publishedAt,
      images,
    },
    twitter: { card: "summary_large_image", title: article.title, description: article.summary },
  };
}

/** Static shell; the article streams in behind its own boundary, like the product page. */
export default function ArticlePage(props: PageProps<"/bai-viet/[slug]">) {
  return (
    <Suspense fallback={<ArticleSkeleton />}>
      <ArticleContent {...props} />
    </Suspense>
  );
}

/**
 * An article page: the question in the title, the answer in the body, and — because a reader who got this far
 * usually needs the part — the products it is about and a way to ask for a price beside it the whole way down.
 */
async function ArticleContent({ params }: PageProps<"/bai-viet/[slug]">) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  return (
    <Container className="py-6 lg:py-10">
      <Suspense fallback={null}>
        <StructuredData article={article} />
      </Suspense>

      <Breadcrumb
        items={[
          { name: "Trang chủ", href: routes.home },
          { name: "Bài viết", href: routes.articles },
          { name: article.title },
        ]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-12">
        <article className="lg:col-span-8">
          <header className="max-w-[68ch]">
            <h1 className="text-[2rem] leading-[1.15] text-balance sm:text-[2.75rem]">
              {article.title}
            </h1>
            <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-base text-muted">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-[18px]" strokeWidth={1.75} aria-hidden />
                <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-[18px]" strokeWidth={1.75} aria-hidden />
                {readingMinutes(article.body)} phút đọc
              </span>
            </p>
          </header>

          {article.coverImageUrl && (
            <div className="mt-8 max-w-[68ch] overflow-hidden rounded-lg border border-line bg-page p-3">
              <Image
                src={article.coverImageUrl}
                alt={article.title}
                width={1200}
                height={900}
                loading="eager"
                fetchPriority="high"
                sizes="(max-width: 1024px) 100vw, 760px"
                className="mx-auto h-auto max-h-[480px] w-full object-contain"
              />
            </div>
          )}

          <div className="mt-10">
            <ArticleBody blocks={article.body} />
          </div>
        </article>

        <aside className="space-y-6 lg:col-span-4">
          <div className="space-y-6 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
            <Suspense fallback={<Skeleton className="h-64" />}>
              <ProductsInArticle slugs={article.relatedProducts} />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-56" />}>
              <AskUs />
            </Suspense>
          </div>
        </aside>
      </div>

      <Suspense fallback={null}>
        <MoreArticles exclude={article.slug} />
      </Suspense>
    </Container>
  );
}

/** The products the article is about, with their part numbers: the step from reading to asking for a price. */
async function ProductsInArticle({ slugs }: { slugs: string[] }) {
  await connection();
  const products = (await Promise.all(slugs.map((slug) => getProduct(slug)))).filter(
    (product) => product !== null,
  );
  if (products.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-page">
      <h2 className="border-b border-line bg-surface px-4 py-3 text-xl">Sản phẩm trong bài</h2>
      <ul className="divide-y divide-line">
        {products.map((product) => (
          <li key={product.slug} className="group relative flex gap-3 p-4 hover:bg-action-50">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-md border border-line bg-surface">
              <ProductImage
                src={product.images[0]?.url ?? null}
                alt=""
                sizes="80px"
                className="p-1.5 mix-blend-multiply"
              />
            </div>
            <div className="min-w-0">
              <Link
                href={routes.product(product.slug)}
                className="font-semibold leading-snug text-ink after:absolute after:inset-0 group-hover:text-action-700"
              >
                {product.name}
              </Link>
              {product.variants[0] && (
                <p className="mt-1">
                  <PartNumber value={product.variants[0].partNumber} copyable={false} />
                </p>
              )}
              <p className="mt-1 text-[15px] font-bold text-action-700">Xem giá và đặt hàng</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The highlighted way out: call, or send a quote request. */
async function AskUs() {
  await connection();
  const company = await getCompany().catch(() => null);
  const hotline = company ? primaryHotline(company) : null;

  return (
    <section className="rounded-lg border-2 border-brand-400 bg-brand-50 p-5">
      <h2 className="text-2xl leading-tight">Cần tư vấn chọn đúng mã?</h2>
      <p className="mt-2 text-body">
        Gửi mã in trên thiết bị hoặc ảnh tem, kỹ thuật viên sẽ kiểm tra và báo giá trong giờ làm
        việc.
      </p>
      <div className="mt-4 grid gap-2.5">
        {hotline && (
          <ButtonLink href={telHref(hotline.phone)} variant="accent" size="lg" className="w-full">
            <Phone className="size-5" strokeWidth={2} aria-hidden />
            Gọi {formatPhone(hotline.phone)}
          </ButtonLink>
        )}
        <ButtonLink href={routes.contact} size="lg" className="w-full">
          <ClipboardList className="size-5" strokeWidth={2} aria-hidden />
          Gửi yêu cầu tư vấn
        </ButtonLink>
      </div>
    </section>
  );
}

async function MoreArticles({ exclude }: { exclude: string }) {
  await connection();
  const result = await listArticles(0, 4);
  const others = result.items.filter((item) => item.slug !== exclude).slice(0, 3);
  if (others.length === 0) return null;

  return (
    <section className="mt-16 border-t border-line pt-10">
      <SectionHeading
        title="Bài viết khác"
        action={
          <Link
            href={routes.articles}
            className="text-[17px] font-bold text-action-600 hover:underline"
          >
            Tất cả bài viết
          </Link>
        }
        className="mb-6"
      />
      <ArticleGrid articles={others} />
    </section>
  );
}

async function StructuredData({ article }: { article: Article }) {
  await connection();
  const company = await getCompany().catch(() => null);
  return (
    <>
      <JsonLd data={articleJsonLd(article, company)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Trang chủ", path: routes.home },
          { name: "Bài viết", path: routes.articles },
          { name: article.title, path: routes.article(article.slug) },
        ])}
      />
    </>
  );
}

function ArticleSkeleton() {
  return (
    <Container className="py-6 lg:py-10" aria-hidden>
      <Skeleton className="h-4 w-80" />
      <div className="mt-6 grid gap-10 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="mt-6 h-80 w-full" />
        </div>
        <Skeleton className="h-72 lg:col-span-4" />
      </div>
    </Container>
  );
}
