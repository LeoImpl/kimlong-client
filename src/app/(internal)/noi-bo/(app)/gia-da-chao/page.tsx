import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar, FilterField, FilterInput } from "@/components/internal/Filters";
import { PageHeader } from "@/components/internal/PageHeader";
import { QuotationStatusBadge } from "@/components/internal/StatusBadge";
import { Alert, EmptyState } from "@/components/ui/Feedback";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";
import { ApiError } from "@/lib/api/problem";
import { findQuotedPrices } from "@/lib/internal/api";
import { formatDay, formatNumber, formatPercent } from "@/lib/internal/format";
import { requireStaff } from "@/lib/internal/session";
import { internalRoutes, param } from "@/lib/internal/routes";
import type { QuotedPrice } from "@/lib/internal/types";

export const metadata: Metadata = { title: "Giá đã chào" };

/**
 * Internal pages read the session and private data, so a navigation waits for the server (behind the area's
 * `loading.tsx`); they are deliberately not validated as "instant".
 */
export const instant = false;

/** "Which price did we offer for part X, to whom, and when?" — over quotations that were sent. */
export default async function QuotedPricesPage({ searchParams }: PageProps<"/noi-bo/gia-da-chao">) {
  await requireStaff();
  const partNumber = param((await searchParams).ma);
  let prices: QuotedPrice[] = [];
  let tooShort = false;
  if (partNumber) {
    try {
      prices = await findQuotedPrices(partNumber);
    } catch (error) {
      // Fewer than two usable characters: a hint under the field, not an error page.
      if (!(error instanceof ApiError) || error.status !== 400) throw error;
      tooShort = true;
    }
  }

  return (
    <>
      <PageHeader
        title="Giá đã chào"
        description="Tra giá đã chào cho một mã hàng trong các báo giá đã gửi, mới nhất trước."
      />
      <FilterBar action={internalRoutes.quotedPrices}>
        <FilterField label="Mã hàng (hoặc phần đầu của mã)" className="min-w-64 flex-1">
          <FilterInput
            type="search"
            name="ma"
            defaultValue={partNumber}
            placeholder="VD: 1613900100 hoặc 1613"
            className="font-mono"
            autoFocus={!partNumber}
          />
        </FilterField>
      </FilterBar>

      {tooShort && <Alert tone="warning">Nhập ít nhất 2 ký tự của mã hàng.</Alert>}
      {!partNumber && (
        <EmptyState
          title="Nhập mã hàng để tra"
          description="Không phân biệt chữ hoa, chữ thường, dấu gạch và khoảng trắng: 1613-9001-00 và 1613900100 là một."
        />
      )}
      {partNumber && !tooShort && prices.length === 0 && (
        <EmptyState
          title={`Chưa chào giá mã "${partNumber}" cho khách nào`}
          description="Chỉ tính các báo giá đã gửi của khách hàng bạn phụ trách; báo giá nháp không tính."
        />
      )}
      {prices.length > 0 && (
        <div className="rounded-lg border border-line bg-page">
          <TableWrap className="mx-0 px-0">
            <Table>
              <thead>
                <tr>
                  <Th>Ngày</Th>
                  <Th>Khách hàng</Th>
                  <Th>Mã hàng</Th>
                  <Th>Tên hàng</Th>
                  <Th className="text-right">SL</Th>
                  <Th className="text-right">Đơn giá</Th>
                  <Th className="bg-brand-50 text-right">Giá vốn</Th>
                  <Th className="bg-brand-50 text-right">Biên LN</Th>
                  <Th>Báo giá</Th>
                  <Th>Kết quả</Th>
                </tr>
              </thead>
              <tbody>
                {prices.map((price, index) => {
                  const margin =
                    price.unitCost !== null && price.unitPrice > 0
                      ? Math.round(((price.unitPrice - price.unitCost) * 1000) / price.unitPrice) /
                        10
                      : null;
                  return (
                    <Tr key={`${price.quotationId}-${index}`}>
                      <Td className="font-mono whitespace-nowrap">{formatDay(price.quoteDate)}</Td>
                      <Td>
                        <Link
                          href={internalRoutes.customer(price.customerId)}
                          className="text-ink hover:text-action-700 hover:underline"
                        >
                          {price.customerName}
                        </Link>
                      </Td>
                      <Td className="font-mono font-semibold whitespace-nowrap text-ink">
                        {price.partNumber}
                      </Td>
                      <Td>{price.name ?? "—"}</Td>
                      <Td className="text-right font-mono whitespace-nowrap">
                        {formatNumber(price.quantity)}
                        {price.unit ? ` ${price.unit}` : ""}
                      </Td>
                      <Td className="text-right font-mono font-semibold whitespace-nowrap text-ink">
                        {formatNumber(price.unitPrice)}
                      </Td>
                      <Td className="bg-brand-50/60 text-right font-mono whitespace-nowrap">
                        {price.unitCost === null ? "—" : formatNumber(price.unitCost)}
                      </Td>
                      <Td className="bg-brand-50/60 text-right font-mono whitespace-nowrap">
                        {margin === null ? "—" : formatPercent(margin)}
                      </Td>
                      <Td className="whitespace-nowrap">
                        <Link
                          href={internalRoutes.quotation(price.quotationId)}
                          className="font-mono font-medium text-action-700 hover:underline"
                        >
                          {price.quotationNumber}
                        </Link>
                      </Td>
                      <Td>
                        <QuotationStatusBadge status={price.status} />
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        </div>
      )}
    </>
  );
}
