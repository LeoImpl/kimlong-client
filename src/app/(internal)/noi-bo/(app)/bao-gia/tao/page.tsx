import type { Metadata } from "next";
import { PageHeader } from "@/components/internal/PageHeader";
import { QuotationComposer } from "@/components/internal/QuotationComposer";
import { getCustomer, getSettings } from "@/lib/internal/api";
import { todayIso } from "@/lib/internal/format";
import { internalRoutes, param } from "@/lib/internal/routes";

export const metadata: Metadata = { title: "Tạo báo giá" };

/**
 * Internal pages read the session and private data, so a navigation waits for the server (behind the area's
 * `loading.tsx`); they are deliberately not validated as "instant".
 */
export const instant = false;

export default async function NewQuotationPage({ searchParams }: PageProps<"/noi-bo/bao-gia/tao">) {
  const customerId = param((await searchParams).khach);
  const [settings, customer] = await Promise.all([
    getSettings(),
    // A customer of someone else (or a mistyped ID) simply leaves the picker empty.
    customerId ? getCustomer(customerId) : Promise.resolve(null),
  ]);

  return (
    <>
      <PageHeader
        title="Tạo báo giá"
        description="Số báo giá được cấp khi lưu lần đầu."
        crumbs={[{ label: "Báo giá", href: internalRoutes.quotations }, { label: "Tạo mới" }]}
      />
      <QuotationComposer
        customer={customer?.active ? customer : null}
        settings={settings}
        today={todayIso()}
      />
    </>
  );
}
