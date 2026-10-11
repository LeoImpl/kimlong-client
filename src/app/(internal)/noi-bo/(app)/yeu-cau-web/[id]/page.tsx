import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader, Panel } from "@/components/internal/PageHeader";
import { WebRequestStatusBadge } from "@/components/internal/StatusBadge";
import { WebRequestActions } from "@/components/internal/WebRequestActions";
import { Badge } from "@/components/ui/Badge";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";
import { getWebRequest } from "@/lib/internal/api";
import { formatInstant } from "@/lib/internal/format";
import { internalRoutes } from "@/lib/internal/routes";

export const metadata: Metadata = { title: "Yêu cầu từ web" };

/**
 * Internal pages read the session and private data, so a navigation waits for the server (behind the area's
 * `loading.tsx`); they are deliberately not validated as "instant".
 */
export const instant = false;

export default async function WebRequestPage({ params }: PageProps<"/noi-bo/yeu-cau-web/[id]">) {
  const { id } = await params;
  const request = await getWebRequest(id);
  // Also the answer for a request a colleague has taken: the platform says 404 for both.
  if (!request) notFound();

  const sender = [
    ["Người gửi", request.contactName],
    ["Công ty", request.company],
    ["Mã số thuế", request.taxCode],
    ["Điện thoại", request.phone],
    ["Email", request.email],
    ["Địa chỉ", request.address],
  ] as const;

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{request.reference}</span>
            <WebRequestStatusBadge status={request.status} />
            {request.consultation && <Badge tone="neutral">Tư vấn</Badge>}
          </span>
        }
        description={
          <>
            Gửi từ website lúc {formatInstant(request.submittedAt)} ·{" "}
            {request.assignee ? `Người nhận: ${request.assignee.name}` : "Chưa ai nhận"}
          </>
        }
        crumbs={[
          { label: "Yêu cầu từ web", href: internalRoutes.webRequests },
          { label: request.reference },
        ]}
      />

      <div className="space-y-4">
        <Panel title="Xử lý">
          <WebRequestActions request={request} />
        </Panel>

        <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
          <Panel title="Người gửi">
            <dl className="space-y-2 text-sm">
              {sender.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-medium text-muted">{label}</dt>
                  <dd className="text-ink">{value ?? "—"}</dd>
                </div>
              ))}
            </dl>
            {request.message && (
              <div className="mt-3 border-t border-line pt-3">
                <p className="text-xs font-medium text-muted">Lời nhắn</p>
                <p className="mt-1 text-sm whitespace-pre-wrap text-ink">{request.message}</p>
              </div>
            )}
          </Panel>

          <Panel title={`Hàng khách yêu cầu (${request.lines.length} dòng)`} bodyClassName="p-0">
            {request.lines.length === 0 ? (
              <p className="p-4 text-sm text-muted">Yêu cầu tư vấn, không có dòng hàng.</p>
            ) : (
              <TableWrap className="mx-0 px-0">
                <Table>
                  <thead>
                    <tr>
                      <Th className="w-10 text-center">#</Th>
                      <Th>Mã hàng</Th>
                      <Th>Sản phẩm / mô tả</Th>
                      <Th className="text-right">Số lượng</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {request.lines.map((line, index) => (
                      <Tr key={index}>
                        <Td className="text-center font-mono text-xs text-muted">{index + 1}</Td>
                        <Td className="font-mono font-semibold whitespace-nowrap text-ink">
                          {line.partNumber ?? "—"}
                        </Td>
                        <Td>
                          {line.productName ?? line.description ?? "—"}
                          {line.productName && line.description && (
                            <span className="block text-xs text-muted">{line.description}</span>
                          )}
                        </Td>
                        <Td className="text-right font-mono whitespace-nowrap">
                          {line.quantity}
                          {line.unit ? ` ${line.unit}` : ""}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
