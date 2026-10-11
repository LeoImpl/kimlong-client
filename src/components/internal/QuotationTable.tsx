import Link from "next/link";
import { QuotationStatusBadge } from "@/components/internal/StatusBadge";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";
import { formatDay, formatNumber } from "@/lib/internal/format";
import { internalRoutes } from "@/lib/internal/routes";
import type { QuotationSummary } from "@/lib/internal/types";

/** Quotations as rows: used by the quotation list and by the customer profile. */
export function QuotationTable({
  quotations,
  showCustomer = true,
  showAssignee = false,
}: {
  quotations: QuotationSummary[];
  showCustomer?: boolean;
  showAssignee?: boolean;
}) {
  return (
    <div className="rounded-lg border border-line bg-page">
      <TableWrap className="mx-0 px-0">
        <Table>
          <thead>
            <tr>
              <Th>Số báo giá</Th>
              <Th>Ngày</Th>
              {showCustomer && <Th>Khách hàng</Th>}
              <Th>Trạng thái</Th>
              <Th className="text-right">Trước VAT</Th>
              <Th className="text-right">Sau VAT</Th>
              <Th>Hiệu lực</Th>
              <Th>Người lập</Th>
              {showAssignee && <Th>Phụ trách</Th>}
            </tr>
          </thead>
          <tbody>
            {quotations.map((quotation) => (
              <Tr key={quotation.id}>
                <Td className="whitespace-nowrap">
                  <Link
                    href={internalRoutes.quotation(quotation.id)}
                    className="font-mono font-semibold text-action-700 hover:underline"
                  >
                    {quotation.number}
                  </Link>
                  {quotation.webRequestReference && (
                    <span className="ml-2 text-xs text-muted" title="Trả lời yêu cầu từ website">
                      ← {quotation.webRequestReference}
                    </span>
                  )}
                </Td>
                <Td className="font-mono whitespace-nowrap">{formatDay(quotation.quoteDate)}</Td>
                {showCustomer && (
                  <Td>
                    <Link
                      href={internalRoutes.customer(quotation.customerId)}
                      className="text-ink hover:text-action-700 hover:underline"
                    >
                      {quotation.customerName}
                    </Link>
                  </Td>
                )}
                <Td>
                  <QuotationStatusBadge status={quotation.status} />
                </Td>
                <Td className="text-right font-mono whitespace-nowrap">
                  {formatNumber(quotation.subtotal)}
                </Td>
                <Td className="text-right font-mono font-semibold whitespace-nowrap text-ink">
                  {formatNumber(quotation.total)}
                </Td>
                <Td className="font-mono whitespace-nowrap">
                  {formatDay(quotation.validUntil) || "—"}
                </Td>
                <Td className="whitespace-nowrap">{quotation.createdByName}</Td>
                {showAssignee && (
                  <Td className="whitespace-nowrap">{quotation.assignee?.name ?? "—"}</Td>
                )}
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
    </div>
  );
}
