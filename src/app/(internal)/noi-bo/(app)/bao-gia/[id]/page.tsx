import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Panel } from "@/components/internal/PageHeader";
import { QuotationActions } from "@/components/internal/QuotationActions";
import { QuotationComposer } from "@/components/internal/QuotationComposer";
import { QuotationStatusBadge } from "@/components/internal/StatusBadge";
import { Alert } from "@/components/ui/Feedback";
import { getCustomer, getQuotation, getSettings } from "@/lib/internal/api";
import { formatDay, formatInstant, todayIso } from "@/lib/internal/format";
import { internalRoutes } from "@/lib/internal/routes";

export const metadata: Metadata = { title: "Báo giá" };

/**
 * Internal pages read the session and private data, so a navigation waits for the server (behind the area's
 * `loading.tsx`); they are deliberately not validated as "instant".
 */
export const instant = false;

export default async function QuotationPage({ params }: PageProps<"/noi-bo/bao-gia/[id]">) {
  const { id } = await params;
  const quotation = await getQuotation(id);
  // Also the answer for a quotation of another salesperson's customer.
  if (!quotation) notFound();
  const [settings, customer] = await Promise.all([
    getSettings(),
    getCustomer(quotation.customerId),
  ]);

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{quotation.number}</span>
            <QuotationStatusBadge status={quotation.status} />
          </span>
        }
        description={
          <>
            <Link
              href={internalRoutes.customer(quotation.customerId)}
              className="font-medium text-ink hover:text-action-700 hover:underline"
            >
              {quotation.customer.companyName}
            </Link>{" "}
            · Ngày {formatDay(quotation.quoteDate)} · Lập bởi {quotation.createdBy.name}
            {quotation.sentAt ? ` · Gửi lúc ${formatInstant(quotation.sentAt)}` : ""}
          </>
        }
        crumbs={[
          { label: "Báo giá", href: internalRoutes.quotations },
          { label: quotation.number },
        ]}
      />

      <div className="space-y-4">
        {quotation.status === "LOST" && (
          <Alert tone="danger" title="Báo giá không thành công">
            {quotation.lostReason ?? "Chưa ghi lý do."}
          </Alert>
        )}
        {(quotation.clonedFrom || quotation.webRequestReference) && (
          <p className="text-sm text-muted">
            {quotation.clonedFrom && (
              <>
                Tạo từ{" "}
                <Link
                  href={internalRoutes.quotation(quotation.clonedFrom)}
                  className="font-medium text-action-600 hover:underline"
                >
                  một báo giá trước
                </Link>
                .{" "}
              </>
            )}
            {quotation.webRequestReference && quotation.webRequestId && (
              <>
                Trả lời yêu cầu từ website{" "}
                <Link
                  href={internalRoutes.webRequest(quotation.webRequestId)}
                  className="font-mono font-medium text-action-600 hover:underline"
                >
                  {quotation.webRequestReference}
                </Link>
                .
              </>
            )}
          </p>
        )}

        <Panel title="Thao tác">
          <QuotationActions quotation={quotation} />
        </Panel>

        {/* Remounted for another quotation, so nothing typed into one leaks into the next. */}
        <QuotationComposer
          key={quotation.id}
          quotation={quotation}
          customer={customer}
          settings={settings}
          today={todayIso()}
        />
      </div>
    </>
  );
}
