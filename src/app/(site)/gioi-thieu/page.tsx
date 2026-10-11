import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Phone } from "lucide-react";
import { categoryIcon } from "@/components/catalog/categoryStyle";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ButtonLink } from "@/components/ui/Button";
import { Container, SectionHeading } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Feedback";
import { getCategories, listProducts } from "@/lib/api/catalog";
import { getCompany, getPartners } from "@/lib/api/company";
import { groupSections, paragraphs } from "@/lib/about";
import type { CompanySection } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { distributorClaim, hotlineHours } from "@/lib/copy";
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
    "Kim Long — đại lý phân phối chính thức phụ tùng máy nén khí và thiết bị tự động hóa chính hãng cho nhà " +
    "máy tại Việt Nam. Tư vấn đúng mã, hotline 24/7, giao hàng toàn quốc.",
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

      <section className="mt-16 rounded-lg border border-line bg-page p-6 text-center sm:p-10">
        <h2 className="text-2xl sm:text-[1.75rem]">Cần tìm đúng mã phụ tùng cho máy của bạn?</h2>
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
        <p className="font-mono text-sm tracking-wide text-brand-700 uppercase">Giới thiệu</p>
        <h1 className="mt-2 text-[2rem] leading-tight text-balance sm:text-[2.5rem]">
          {company.legalName}
        </h1>
        {company.tagline && <p className="mt-3 text-xl text-body">{company.tagline}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href={routes.contact} size="lg">
            Liên hệ tư vấn
          </ButtonLink>
          {hotline && (
            <ButtonLink
              href={telHref(hotline.phone)}
              variant="secondary"
              size="lg"
              title={hotlineHours.full}
            >
              <Phone className="size-5" strokeWidth={2} aria-hidden />
              {hotlineHours.short}: {formatPhone(hotline.phone)}
            </ButtonLink>
          )}
        </div>
      </header>

      {/* The facts a buyer checks: who we are legally, where, since when, and a number that is answered. */}
      <dl className="plate-cells mt-10 [--cell:12rem]">
        <Fact label="Trụ sở" value={company.headquarters} />
        <Fact label="Thành lập" value={company.foundedYear ? String(company.foundedYear) : null} />
        <Fact label="Mã số thuế" value={company.taxCode} mono />
        <Fact
          label={hotlineHours.short}
          value={hotline ? formatPhone(hotline.phone) : null}
          href={hotline ? telHref(hotline.phone) : undefined}
        />
      </dl>

      <AboutSections sections={company.aboutSections} />

      <Suspense fallback={<Skeleton className="mt-16 h-72" />}>
        <SupplyFields />
      </Suspense>

      {company.highlights.length > 0 && (
        <section className="mt-16">
          <SectionHeading title="Vì sao khách hàng chọn Kim Long" className="mb-6" />
          <ol className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {company.highlights.map((highlight, index) => (
              <li key={highlight.title} className="bg-page p-5 sm:p-6">
                <span className="font-mono text-sm font-semibold text-brand-700" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-xl leading-snug">{highlight.title}</h3>
                <p className="mt-2 text-[15px] text-body">{highlight.body}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {company.milestones.length > 0 && (
        <section className="mt-16 max-w-3xl">
          <SectionHeading title="Chặng đường phát triển" className="mb-6" />
          <ol className="space-y-6 border-l border-line pl-6">
            {[...company.milestones]
              .sort((a, b) => a.year - b.year)
              .map((milestone) => (
                <li key={`${milestone.year}-${milestone.title}`} className="relative">
                  <span
                    className="absolute top-1.5 -left-[31px] size-2.5 rounded-full border-2 border-page bg-brand-500"
                    aria-hidden
                  />
                  <p className="font-mono text-sm text-brand-700">{milestone.year}</p>
                  <h3 className="mt-1 text-xl">{milestone.title}</h3>
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
                  className="text-sm text-action-600 hover:underline"
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

/**
 * The company introduction, laid out by the shape of each section rather than by its title, so the back office
 * can rename, reorder or add sections freely:
 * - the first section opens the page as the lead;
 * - consecutive one-paragraph sections (vision, mission) become statement cards side by side;
 * - a section whose every paragraph reads "Term: explanation" (values, steps) becomes a numbered grid;
 * - anything else is prose.
 */
function AboutSections({ sections }: { sections: CompanySection[] }) {
  return (
    <>
      {groupSections(sections).map((block, index) => {
        switch (block.kind) {
          case "lead":
            return (
              <section
                key={block.section.title}
                className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-14"
              >
                <div>
                  <h2 className="text-[1.75rem] leading-tight sm:text-[2rem]">
                    {block.section.title}
                  </h2>
                  <span className="mt-2 block h-1 w-14 rounded-full bg-brand-500" aria-hidden />
                </div>
                <div className="space-y-4 text-lg leading-relaxed text-body">
                  {paragraphs(block.section.body).map((paragraph, position) => (
                    <p key={position} className={position === 0 ? "text-ink" : undefined}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            );
          case "statements":
            return (
              <div key={`statements-${index}`} className="mt-14 grid gap-4 md:grid-cols-2">
                {block.sections.map((section) => (
                  <section
                    key={section.title}
                    className="rounded-lg border border-line border-t-4 border-t-brand-500 bg-page p-6 sm:p-8"
                  >
                    <h2 className="font-mono text-sm font-semibold tracking-wide text-brand-700 uppercase">
                      {section.title}
                    </h2>
                    <p className="mt-3 text-xl leading-snug text-ink">{section.body}</p>
                  </section>
                ))}
              </div>
            );
          case "items":
            return (
              <section key={block.section.title} className="mt-16">
                <SectionHeading title={block.section.title} className="mb-6" />
                <ol
                  className={cn(
                    "grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2",
                    itemColumns[block.items.length] ?? "lg:grid-cols-4",
                  )}
                >
                  {block.items.map((item, position) => (
                    <li key={item.term} className="bg-page p-5 sm:p-6">
                      <span className="font-mono text-sm font-semibold text-brand-700" aria-hidden>
                        {String(position + 1).padStart(2, "0")}
                      </span>
                      <h3 className="mt-2 text-xl leading-snug">{item.term}</h3>
                      <p className="mt-2 text-[15px] text-body">{item.text}</p>
                    </li>
                  ))}
                </ol>
              </section>
            );
          case "prose":
            return (
              <section key={block.section.title} className="mt-16 max-w-3xl">
                <SectionHeading title={block.section.title} className="mb-4" />
                <div className="space-y-3 text-[17px] leading-relaxed text-body">
                  {paragraphs(block.section.body).map((paragraph, position) => (
                    <p key={position}>{paragraph}</p>
                  ))}
                </div>
              </section>
            );
        }
      })}
    </>
  );
}

/** Literal class names, so Tailwind finds them. */
const itemColumns: Record<number, string> = {
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
};

/**
 * What we supply, built from the catalogue rather than written in the profile: the product types, the brands
 * actually stocked and the number of products per family can then never contradict the shop.
 */
async function SupplyFields() {
  await connection();
  const families = await getCategories();
  const listings = await Promise.all(
    families.map((family) => listProducts({ category: family.slug, size: 1, facets: true })),
  );

  return (
    <section className="mt-16">
      <SectionHeading
        title="Lĩnh vực cung ứng"
        description="Ba nhóm sản phẩm chủ lực, tra cứu được ngay trên website theo mã hoặc theo hãng."
        className="mb-6"
      />
      <ul className="grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3">
        {families.map((family, index) => {
          const Icon = categoryIcon(family.slug);
          const listing = listings[index];
          const brands = listing?.facets?.brands ?? [];
          return (
            <li key={family.slug} className="flex flex-col bg-page p-5 sm:p-6">
              <span className="flex size-11 items-center justify-center rounded-md bg-action-50 text-action-600">
                <Icon className="size-6" strokeWidth={1.5} aria-hidden />
              </span>
              <h3 className="mt-3 text-2xl leading-tight">
                <Link href={routes.category(family.slug)} className="hover:underline">
                  {family.name}
                </Link>
              </h3>
              {listing && listing.totalItems > 0 && (
                <p className="mt-1 text-sm text-muted">
                  {listing.totalItems} sản phẩm trên website
                </p>
              )}
              {family.children.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {family.children.map((type) => (
                    <li key={type.slug}>
                      <Link
                        href={routes.category(type.slug)}
                        className="inline-block rounded-sm border border-line px-2 py-1 text-sm text-body hover:border-action-600 hover:text-action-700"
                      >
                        {type.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {brands.length > 0 && (
                <p className="mt-auto pt-5 text-sm text-body">
                  <span className="text-muted">Thương hiệu: </span>
                  {brands.map((brand, position) => (
                    <span key={brand.slug}>
                      {position > 0 && ", "}
                      <Link
                        href={routes.brand(brand.slug)}
                        className="hover:text-action-700 hover:underline"
                      >
                        {brand.name}
                      </Link>
                    </span>
                  ))}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
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
    <div className="p-4">
      <dt className="text-[15px] text-muted">{label}</dt>
      <dd className={`mt-1 font-medium text-ink ${mono ? "font-mono" : ""}`}>
        {href ? (
          <a href={href} className="text-action-600 hover:underline">
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
        title={distributorClaim.title}
        description={distributorClaim.description}
        action={
          <Link
            href={routes.brands}
            className="text-sm font-medium text-action-600 hover:underline"
          >
            Xem sản phẩm theo hãng
          </Link>
        }
        className="mb-6"
      />
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {partners.map((partner) => (
          <li key={partner.slug} className="rounded-lg border border-line bg-page p-4">
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
