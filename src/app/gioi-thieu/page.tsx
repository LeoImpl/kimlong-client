import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ButtonLink } from "@/components/ui/Button";
import { Container, SectionHeading } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Feedback";
import { getCompany, getPartners } from "@/lib/api/company";
import { formatPhone, telHref } from "@/lib/phone";
import { routes } from "@/lib/routes";

/**
 * The page a purchasing officer opens before sending money to a supplier they found on Google. Everything on it
 * comes from `GET /company`, so it can never drift from what the back office says — an "about us" that
 * contradicts the invoice is worse than none.
 */
export const metadata: Metadata = {
  title: "Giới thiệu",
  description:
    "Kim Long — nhà cung cấp phụ tùng máy nén khí chính hãng và thiết bị tự động hóa công nghiệp cho nhà máy " +
    "tại Việt Nam.",
  alternates: { canonical: routes.about },
};

export default function AboutPage() {
  return (
    <Container className="py-6 lg:py-10">
      <Breadcrumb items={[{ name: "Trang chủ", href: routes.home }, { name: "Giới thiệu" }]} />

      <Suspense fallback={<Skeleton className="mt-6 h-96" />}>
        <Profile />
      </Suspense>

      <Suspense fallback={<Skeleton className="mt-16 h-40" />}>
        <Partners />
      </Suspense>

      <section className="mt-16 rounded-lg border border-line/80 bg-page shadow-card p-6 text-center sm:p-10">
        <h2 className="text-xl font-semibold text-ink sm:text-2xl">
          Cần tìm đúng mã phụ tùng cho máy của bạn?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-body">
          Gửi model máy hoặc mã sản phẩm, đội ngũ kỹ thuật sẽ xác nhận đúng chủng loại trước khi báo
          giá.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href={routes.contact} size="lg">
            Liên hệ tư vấn
          </ButtonLink>
          <ButtonLink href={routes.products} variant="secondary" size="lg">
            Xem sản phẩm
          </ButtonLink>
        </div>
      </section>
    </Container>
  );
}

async function Profile() {
  await connection();
  const company = await getCompany();
  const hotline = company.hotlines[0];

  return (
    <>
      <header className="mt-4 max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {company.legalName}
        </h1>
        {company.tagline && <p className="mt-3 text-lg text-body">{company.tagline}</p>}
      </header>

      {/* The facts a buyer checks: who we are legally, where, since when, and a number that is answered. */}
      <dl className="mt-8 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Trụ sở" value={company.headquarters} />
        <Fact label="Thành lập" value={company.foundedYear ? String(company.foundedYear) : null} />
        <Fact label="Mã số thuế" value={company.taxCode} mono />
        <Fact
          label="Hotline"
          value={hotline ? formatPhone(hotline.phone) : null}
          href={hotline ? telHref(hotline.phone) : undefined}
        />
      </dl>

      {company.aboutSections.length > 0 && (
        <div className="mt-12 max-w-3xl space-y-10">
          {company.aboutSections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold text-ink">{section.title}</h2>
              <div className="mt-3 space-y-3 text-body">
                {section.body.split(/\n{2,}/).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {company.highlights.length > 0 && (
        <section className="mt-16">
          <SectionHeading title="Vì sao khách hàng chọn Kim Long" className="mb-6" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {company.highlights.map((highlight) => (
              <li
                key={highlight.title}
                className="rounded-lg border border-line/80 bg-page shadow-card p-5"
              >
                <h3 className="text-base font-semibold text-ink">{highlight.title}</h3>
                <p className="mt-2 text-sm text-body">{highlight.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {company.milestones.length > 0 && (
        <section className="mt-16 max-w-3xl">
          <SectionHeading title="Chặng đường" className="mb-6" />
          <ol className="space-y-6 border-l border-line pl-6">
            {[...company.milestones]
              .sort((a, b) => a.year - b.year)
              .map((milestone) => (
                <li key={`${milestone.year}-${milestone.title}`} className="relative">
                  <span
                    className="absolute top-1.5 -left-[31px] size-2.5 rounded-full border-2 border-page bg-brand-900"
                    aria-hidden
                  />
                  <p className="font-mono text-sm text-brand-700">{milestone.year}</p>
                  <h3 className="mt-1 text-base font-medium text-ink">{milestone.title}</h3>
                  {milestone.description && (
                    <p className="mt-1 text-sm text-body">{milestone.description}</p>
                  )}
                </li>
              ))}
          </ol>
        </section>
      )}

      {company.technicalDocuments.length > 0 && (
        <section className="mt-16 max-w-3xl">
          <SectionHeading
            title="Tài liệu kỹ thuật"
            description="Catalogue và tài liệu tra cứu dùng chung."
            className="mb-4"
          />
          <ul className="divide-y divide-line border-y border-line">
            {company.technicalDocuments.map((document) => (
              <li key={document.url} className="py-3">
                <a
                  href={document.url}
                  target="_blank"
                  rel="noopener"
                  className="text-sm text-brand-700 hover:underline"
                >
                  {document.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function Fact({
  label,
  value,
  href,
  mono,
}: {
  label: string;
  value: string | null;
  href?: string;
  mono?: boolean;
}) {
  // A fact we do not have is left out rather than shown as "—": a blank where a tax code should be reads badly.
  if (!value) return null;
  return (
    <div className="bg-page p-4">
      <dt className="text-xs text-muted uppercase">{label}</dt>
      <dd className={`mt-1 text-sm font-medium text-ink ${mono ? "font-mono" : ""}`}>
        {href ? (
          <a href={href} className="text-brand-700 hover:underline">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

async function Partners() {
  await connection();
  const partners = await getPartners();
  if (partners.length === 0) return null;

  return (
    <section className="mt-16">
      <SectionHeading
        title="Hãng chúng tôi phân phối"
        description="Hàng chính hãng, chứng từ đầy đủ."
        action={
          <Link href={routes.brands} className="text-sm font-medium text-brand-700 hover:underline">
            Xem sản phẩm theo hãng
          </Link>
        }
        className="mb-6"
      />
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {partners.map((partner) => (
          <li
            key={partner.slug}
            className="rounded-lg border border-line/80 bg-page shadow-card p-4"
          >
            <div className="relative flex h-14 items-center justify-center">
              {partner.logoUrl ? (
                <Image
                  src={partner.logoUrl}
                  alt={partner.name}
                  fill
                  sizes="200px"
                  className="object-contain"
                />
              ) : (
                <span className="text-sm font-semibold text-body">{partner.name}</span>
              )}
            </div>
            {partner.description && (
              <p className="mt-2 text-center text-xs text-muted">{partner.description}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
