import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";
import { PageHeader } from "@/components/internal/PageHeader";
import { QuotationStatusBadge, WebRequestStatusBadge } from "@/components/internal/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Feedback";
import { Pagination } from "@/components/ui/Pagination";
import { Table, TableWrap, Td, Th } from "@/components/ui/Table";
import { cn } from "@/lib/cn";
import { listWebRequests } from "@/lib/internal/api";
import { formatInstant } from "@/lib/internal/format";
import { internalRoutes, pageParam, param, withQuery } from "@/lib/internal/routes";

export const metadata: Metadata = { title: "Yêu cầu từ web" };

/**
 * Internal pages read the session and private data, so a navigation waits for the server (behind the area's
 * `loading.tsx`); they are deliberately not validated as "instant".
 */
export const instant = false;

/**
 * Quote requests sent from the public website. Everyone sees the whole list; a request a colleague has taken is
 * greyed out and is not a link (decision A3) — and the platform does not return its details either.
 */
export default async function WebRequestsPage({ searchParams }: PageProps<"/noi-bo/yeu-cau-web">) {
  const params = await searchParams;
  const all = param(params.xem) === "tat-ca";
  const requests = await listWebRequests({ open: !all, page: pageParam(params.trang) });
  const current = { xem: all ? "tat-ca" : undefined };

  return (
    <>
      <PageHeader
        title="Yêu cầu từ web"
        description="Yêu cầu báo giá khách gửi từ website. Nhận một yêu cầu để lập báo giá mà không phải gõ lại dòng hàng."
        actions={
          <div
            role="group"
            aria-label="Phạm vi"
            className="inline-flex rounded-full border border-line bg-surface p-0.5"
          >
            {[
              { label: "Đang chờ", href: internalRoutes.webRequests, active: !all },
              { label: "Tất cả", href: `${internalRoutes.webRequests}?xem=tat-ca`, active: all },
            ].map((option) => (
              <Link
                key={option.label}
                href={option.href}
                aria-current={option.active ? "true" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-1 text-sm font-medium transition-colors",
                  option.active
                    ? "bg-linear-to-r from-action-500 to-[#06b6d4] text-white shadow-[0_4px_12px_-4px_rgb(37_99_235/0.75)]"
                    : "text-body hover:bg-page hover:text-action-700",
                )}
              >
                {option.label}
              </Link>
            ))}
          </div>
        }
      />

      {requests.items.length === 0 ? (
        <EmptyState
          title={all ? "Chưa có yêu cầu nào từ website" : "Không có yêu cầu nào đang chờ"}
          description="Yêu cầu mới sẽ xuất hiện ở đây ngay khi khách gửi từ trang công khai."
        />
      ) : (
        <div className="rounded-lg border border-line bg-page">
          <TableWrap className="mx-0 px-0">
            <Table>
              <thead>
                <tr>
                  <Th>Mã yêu cầu</Th>
                  <Th>Gửi lúc</Th>
                  <Th>Công ty</Th>
                  <Th>Người gửi</Th>
                  <Th className="text-right">Số dòng</Th>
                  <Th>Trạng thái</Th>
                  <Th>Người nhận</Th>
                  <Th>Báo giá</Th>
                </tr>
              </thead>
              <tbody>
                {requests.items.map((request) => {
                  const taken = request.access === "TAKEN";
                  return (
                    <tr
                      key={request.id}
                      aria-disabled={taken || undefined}
                      className={cn(
                        "transition-colors",
                        taken ? "bg-surface text-muted" : "hover:bg-surface",
                      )}
                    >
                      <Td className="whitespace-nowrap">
                        {taken ? (
                          <span className="inline-flex items-center gap-1.5 font-mono text-muted">
                            <Lock
                              className="size-3.5"
                              strokeWidth={1.75}
                              aria-label="Nhân viên khác đã nhận"
                            />
                            {request.reference}
                          </span>
                        ) : (
                          <Link
                            href={internalRoutes.webRequest(request.id)}
                            className="font-mono font-semibold text-action-700 hover:underline"
                          >
                            {request.reference}
                          </Link>
                        )}
                        {request.consultation && (
                          <Badge className="ml-2" tone="neutral">
                            Tư vấn
                          </Badge>
                        )}
                      </Td>
                      <Td className={cn("font-mono whitespace-nowrap", taken && "text-muted")}>
                        {formatInstant(request.submittedAt)}
                      </Td>
                      <Td className={taken ? "text-muted" : "text-ink"}>
                        {request.company ?? "—"}
                      </Td>
                      <Td className={taken ? "text-muted" : undefined}>
                        {taken ? "—" : (request.contactName ?? "—")}
                      </Td>
                      <Td className={cn("text-right font-mono", taken && "text-muted")}>
                        {taken ? "—" : request.lineCount}
                      </Td>
                      <Td>{taken ? "—" : <WebRequestStatusBadge status={request.status} />}</Td>
                      <Td className="whitespace-nowrap">
                        {request.access === "FREE" ? (
                          <Badge tone="warning">Chưa ai nhận</Badge>
                        ) : request.access === "MINE" ? (
                          <Badge tone="success">Bạn</Badge>
                        ) : (
                          <span className={taken ? "text-muted" : undefined}>
                            {request.assignee?.name ?? "—"}
                          </span>
                        )}
                      </Td>
                      <Td className="whitespace-nowrap">
                        {request.quotation ? (
                          <span className="inline-flex items-center gap-2">
                            <Link
                              href={internalRoutes.quotation(request.quotation.id)}
                              className="font-mono font-medium text-action-700 hover:underline"
                            >
                              {request.quotation.number}
                            </Link>
                            <QuotationStatusBadge status={request.quotation.status} />
                          </span>
                        ) : (
                          "—"
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        </div>
      )}

      <div className="mt-4">
        <Pagination
          page={requests.page}
          totalPages={requests.totalPages}
          buildHref={(page) => withQuery(internalRoutes.webRequests, current, { trang: page + 1 })}
        />
      </div>
    </>
  );
}
