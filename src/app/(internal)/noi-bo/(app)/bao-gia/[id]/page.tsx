import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Panel } from "@/components/internal/PageHeader";
import { QuotationActions } from "@/components/internal/QuotationActions";
import { QuotationComposer } from "@/components/internal/QuotationComposer";
import { QuotationFiles } from "@/components/internal/QuotationFiles";
import { QuotationStatusBadge } from "@/components/internal/StatusBadge";
import { WinQuotation } from "@/components/internal/WinQuotation";
import { Alert } from "@/components/ui/Feedback";
import {
  getCustomer,
  getQuotation,
  getSellerStatus,
  getSettings,
  listDocuments,
  searchOrders,
} from "@/lib/internal/api";
import { formatDay, formatInstant, todayIso } from "@/lib/internal/format";
import { internalRoutes } from "@/lib/internal/routes";

export const metadata: Metadata = { title: "Báo giá" };

/**
 * Internal pages read the session and private data, so a navigation waits for the server (behind the area's
 * `loading.tsx`); they are deliberately not validated as "instant".
 */
export const instant = false;

/** What the seller header of a printed quotation needs, in the words of the warning. */
const sellerDetails: Record<string, string> = {
  taxCode: "mã số thuế",
  address: "địa chỉ",
  logo: "logo (PNG hoặc JPEG)",
  bankAccount: "tài khoản ngân hàng",
};

export default async function QuotationPage({ params }: PageProps<"/noi-bo/bao-gia/[id]">) {
  const { id } = await params;
  const quotation = await getQuotation(id);
  // Also the answer for a quotation of another salesperson's customer.
  if (!quotation) notFound();
  const [settings, customer, documents, seller] = await Promise.all([
    getSettings(),
    getCustomer(quotation.customerId),
    listDocuments(quotation.id),
    getSellerStatus(),
  ]);
  const missing = seller.missing.map((item) => sellerDetails[item] ?? item);
  // The order a won quotation became, found by the quotation number it carries.
  const order =
    quotation.status === "WON"
      ? (await searchOrders({ q: quotation.number, size: 5 })).items.find(
          (candidate) => candidate.quotationNumber === quotation.number,
        )
      : undefined;
  const today = todayIso();

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

        {order && (
          <Alert tone="success" title="Báo giá đã chốt">
            Đơn hàng{" "}
            <Link
              href={internalRoutes.order(order.id)}
              className="font-mono font-semibold underline underline-offset-2"
            >
              {order.number}
            </Link>{" "}
            được tạo từ báo giá này.
          </Alert>
        )}

        <Panel title="Thao tác" bodyClassName="space-y-3">
          <WinQuotation quotation={quotation} today={today} />
          <QuotationActions quotation={quotation} />
        </Panel>

        <Panel title="File báo giá">
          {missing.length > 0 && (
            <Alert
              tone="warning"
              className="mb-3"
              title="Thông tin Kim Long in trên báo giá còn thiếu"
            >
              Chưa có: {missing.join(", ")}. File vẫn xuất được nhưng phần đó sẽ để trống; quản trị
              viên bổ sung trong hồ sơ công ty và cấu hình hệ thống.
            </Alert>
          )}
          <QuotationFiles quotation={quotation} documents={documents} />
        </Panel>

        {/* Remounted for another quotation, so nothing typed into one leaks into the next. */}
        <QuotationComposer
          key={quotation.id}
          quotation={quotation}
          customer={customer}
          settings={settings}
          today={today}
        />
      </div>
    </>
  );
}
