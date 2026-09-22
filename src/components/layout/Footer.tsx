import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { getCategories } from "@/lib/api/catalog";
import { formatPhone, getCompany, telHref, zaloHref } from "@/lib/api/company";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Feedback";
import { routes } from "@/lib/routes";

/**
 * The footer is a trust signal, not decoration: a Vietnamese buyer checks the legal name, the tax code and a real
 * address before sending an enquiry to a supplier they found on Google. All of it comes from `GET /company`, so
 * it can never drift from what the back office says.
 */
export function Footer() {
  return (
    <footer className="mt-16 border-t border-line/80 bg-page">
      <Container className="py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <Suspense fallback={<ColumnSkeleton />}>
            <CompanyColumn />
          </Suspense>
          <Suspense fallback={<ColumnSkeleton />}>
            <CategoryColumn />
          </Suspense>
          <div>
            <h2 className="text-sm font-semibold text-ink">Thông tin</h2>
            <ul className="mt-3 space-y-2 text-sm text-body">
              <li>
                <Link href={routes.about} className="hover:text-brand-700">
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link href={routes.products} className="hover:text-brand-700">
                  Tất cả sản phẩm
                </Link>
              </li>
              <li>
                <Link href={routes.brands} className="hover:text-brand-700">
                  Thương hiệu
                </Link>
              </li>
              <li>
                <Link href={routes.quote} className="hover:text-brand-700">
                  Yêu cầu báo giá
                </Link>
              </li>
              <li>
                <Link href={routes.contact} className="hover:text-brand-700">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>
          <Suspense fallback={<ColumnSkeleton />}>
            <ContactColumn />
          </Suspense>
        </div>
      </Container>
      <div className="border-t border-line/80 bg-canvas">
        <Container className="py-4">
          <Suspense fallback={<Skeleton className="h-3 w-72" />}>
            <Copyright />
          </Suspense>
        </Container>
      </div>
    </footer>
  );
}

async function CompanyColumn() {
  await connection();
  const company = await getCompany();
  return (
    <div>
      <h2 className="text-sm font-semibold text-ink">{company.legalName}</h2>
      {company.tagline && <p className="mt-3 text-sm text-body">{company.tagline}</p>}
      {company.headquarters && <p className="mt-3 text-sm text-body">{company.headquarters}</p>}
      {company.foundedYear && (
        <p className="mt-2 text-sm text-muted">Thành lập năm {company.foundedYear}</p>
      )}
    </div>
  );
}

async function CategoryColumn() {
  await connection();
  const categories = await getCategories();
  return (
    <div>
      <h2 className="text-sm font-semibold text-ink">Danh mục</h2>
      <ul className="mt-3 space-y-2 text-sm text-body">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link href={routes.category(category.slug)} className="hover:text-brand-700">
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function ContactColumn() {
  await connection();
  const company = await getCompany();
  // Sales and support may share a number, and listing it twice looks like a mistake rather than two lines.
  const hotlines = company.hotlines.filter(
    (hotline, index) =>
      company.hotlines.findIndex((other) => other.phone === hotline.phone) === index,
  );
  return (
    <div>
      <h2 className="text-sm font-semibold text-ink">Liên hệ</h2>
      <ul className="mt-3 space-y-2 text-sm text-body">
        {hotlines.map((hotline) => (
          <li key={hotline.phone}>
            <a href={telHref(hotline.phone)} className="font-medium text-brand-700 hover:underline">
              {formatPhone(hotline.phone)}
            </a>
            {hotline.label && <span className="ml-1 text-muted">· {hotline.label}</span>}
          </li>
        ))}
        <li>
          <a href={`mailto:${company.email}`} className="hover:text-brand-700">
            {company.email}
          </a>
        </li>
        {hotlines[0] && (
          <li>
            <a
              href={zaloHref(hotlines[0].phone)}
              target="_blank"
              rel="noopener"
              className="hover:text-brand-700"
            >
              Chat Zalo
            </a>
          </li>
        )}
      </ul>
    </div>
  );
}

async function Copyright() {
  await connection();
  const company = await getCompany();
  return (
    <p className="text-xs text-muted">
      © {new Date().getFullYear()} {company.legalName}. Mọi thông tin sản phẩm chỉ mang tính tham
      khảo, vui lòng liên hệ để được báo giá chính xác.
    </p>
  );
}

function ColumnSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-3 w-40" />
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
}
