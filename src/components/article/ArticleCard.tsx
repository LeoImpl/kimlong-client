import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { ProductImage } from "@/components/catalog/ProductImage";
import type { ArticleSummary } from "@/lib/api/types";
import { formatDate } from "@/lib/date";
import { routes } from "@/lib/routes";

/** An article in a grid: picture, title, the summary and the date. The whole card is the title's link. */
export function ArticleCard({ article, eager }: { article: ArticleSummary; eager?: boolean }) {
  return (
    <article className="group hover-lift relative flex h-full flex-col overflow-hidden rounded-lg border border-line bg-page">
      <div className="relative aspect-16/10 overflow-hidden border-b border-line bg-surface">
        <ProductImage
          src={article.coverImageUrl}
          alt=""
          eager={eager}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="p-3 mix-blend-multiply transition-transform duration-300 ease-out group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="flex items-center gap-1.5 text-[15px] text-muted">
          <CalendarDays className="size-4" strokeWidth={1.75} aria-hidden />
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
        </p>
        <h3 className="mt-2 font-sans text-xl leading-snug font-bold">
          <Link
            href={routes.article(article.slug)}
            className="transition-colors after:absolute after:inset-0 group-hover:text-action-700"
          >
            {article.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-body">{article.summary}</p>
        <p className="mt-auto pt-4 font-bold text-action-700">Đọc bài viết</p>
      </div>
    </article>
  );
}

export function ArticleGrid({ articles }: { articles: ArticleSummary[] }) {
  return (
    <ul className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      {articles.map((article, index) => (
        <li key={article.slug} style={{ "--i": index } as React.CSSProperties}>
          <ArticleCard article={article} eager={index < 3} />
        </li>
      ))}
    </ul>
  );
}
