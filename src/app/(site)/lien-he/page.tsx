import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { ConsultationForm } from "@/components/quote/ConsultationForm";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Feedback";
import { formatPhone, getCompany, primaryHotline, telHref, zaloHref } from "@/lib/api/company";
import { hotlineHours } from "@/lib/copy";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Liên hệ",
  description:
    "Liên hệ Kim Long để được tư vấn phụ tùng máy nén khí và thiết bị tự động hóa: hotline, Zalo, email và " +
    "địa chỉ công ty.",
  alternates: { canonical: routes.contact },
};

export default function ContactPage({ searchParams }: PageProps<"/lien-he">) {
  return (
    <Container className="py-6 lg:py-10">
      <Breadcrumb items={[{ name: "Trang chủ", href: routes.home }, { name: "Liên hệ" }]} />
      <h1 className="mt-4 text-[2rem] leading-tight sm:text-[2.5rem]">Liên hệ</h1>
      <p className="mt-2 max-w-2xl text-body">
        Hotline của Kim Long trực 24/7, kể cả cuối tuần và ngày lễ — hãy gọi ngay khi cần gấp, hoặc
        gửi yêu cầu tư vấn để chúng tôi tìm đúng mã sản phẩm cho máy của bạn.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <Suspense fallback={<Skeleton className="h-[32rem]" />}>
          <Form searchParams={searchParams} />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-64" />}>
          <ContactDetails />
        </Suspense>
      </div>
    </Container>
  );
}

/** `?ma=` comes from a search with no match: the request for that item is already written, the buyer only adds a quantity. */
async function Form({ searchParams }: { searchParams: PageProps<"/lien-he">["searchParams"] }) {
  await connection();
  const [company, { ma }] = await Promise.all([getCompany(), searchParams]);
  const item = (Array.isArray(ma) ? ma[0] : ma)?.trim().slice(0, MAX_ITEM_LENGTH);
  return (
    <ConsultationForm
      hotline={primaryHotline(company)?.phone ?? null}
      initialMessage={item ? `Tôi cần báo giá sản phẩm: ${item}\nSố lượng: ` : ""}
    />
  );
}

/** A part number or a short product name; anything longer is not a search someone typed. */
const MAX_ITEM_LENGTH = 120;

async function ContactDetails() {
  await connection();
  const company = await getCompany();
  const hotlines = company.hotlines.filter(
    (hotline, index) =>
      company.hotlines.findIndex((other) => other.phone === hotline.phone) === index,
  );

  return (
    <aside className="rounded-lg border border-line bg-page p-5">
      <h2 className="text-xl">{company.legalName}</h2>
      {company.headquarters && <p className="mt-3 text-sm text-body">{company.headquarters}</p>}

      <dl className="mt-4 space-y-3 text-sm">
        {hotlines.map((hotline) => (
          <div key={hotline.phone}>
            <dt className="text-muted">
              {hotline.label ?? (hotline.type === "SALES" ? "Kinh doanh" : "Hỗ trợ")}
            </dt>
            <dd>
              <a
                href={telHref(hotline.phone)}
                className="font-semibold text-action-600 hover:underline"
              >
                {formatPhone(hotline.phone)}
              </a>
              <span className="block text-muted">{hotlineHours.full}</span>
            </dd>
          </div>
        ))}
        <div>
          <dt className="text-muted">Email</dt>
          <dd>
            <a href={`mailto:${company.email}`} className="text-action-600 hover:underline">
              {company.email}
            </a>
          </dd>
        </div>
        {hotlines[0] && (
          <div>
            <dt className="text-muted">Zalo</dt>
            <dd>
              <a
                href={zaloHref(hotlines[0].phone)}
                target="_blank"
                rel="noopener"
                className="text-action-600 hover:underline"
              >
                Chat với chúng tôi
              </a>
            </dd>
          </div>
        )}
      </dl>
    </aside>
  );
}
