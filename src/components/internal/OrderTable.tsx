import Link from "next/link";
import { DeliveryStatusBadge, PaymentStatusBadge } from "@/components/internal/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";
import { formatDay, formatNumber } from "@/lib/internal/format";
import { internalRoutes } from "@/lib/internal/routes";
import type { SalesOrderSummary } from "@/lib/internal/types";

/** Orders as rows: used by the order list and by the customer profile. */
export function OrderTable({
  orders,
  showCustomer = true,
  showAssignee = false,
}: {
  orders: SalesOrderSummary[];
  showCustomer?: boolean;
  showAssignee?: boolean;
}) {
  return (
    <div className="rounded-lg border border-line bg-page">
      <TableWrap className="mx-0 px-0">
        <Table>
          <thead>
            <tr>
              <Th>Số đơn hàng</Th>
              <Th>Ngày đặt</Th>
              {showCustomer && <Th>Khách hàng</Th>}
              <Th>Giao hàng</Th>
              <Th>Thanh toán</Th>
              <Th className="text-right">Trước VAT</Th>
              <Th className="text-right">Sau VAT</Th>
              <Th className="text-right">Còn phải thu</Th>
              <Th>Từ báo giá</Th>
              {showAssignee && <Th>Phụ trách</Th>}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <Tr key={order.id} className={order.cancelled ? "opacity-60" : undefined}>
                <Td className="whitespace-nowrap">
                  <Link
                    href={internalRoutes.order(order.id)}
                    className="font-mono font-semibold text-action-700 hover:underline"
                  >
                    {order.number}
                  </Link>
                </Td>
                <Td className="font-mono whitespace-nowrap">{formatDay(order.orderDate)}</Td>
                {showCustomer && (
                  <Td>
                    <Link
                      href={internalRoutes.customer(order.customerId)}
                      className="text-ink hover:text-action-700 hover:underline"
                    >
                      {order.customerName}
                    </Link>
                  </Td>
                )}
                {order.cancelled ? (
                  <Td colSpan={2}>
                    <Badge tone="danger">Đã hủy</Badge>
                  </Td>
                ) : (
                  <>
                    <Td>
                      <DeliveryStatusBadge status={order.deliveryStatus} />
                    </Td>
                    <Td>
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </Td>
                  </>
                )}
                <Td className="text-right font-mono whitespace-nowrap">
                  {formatNumber(order.subtotal)}
                </Td>
                <Td className="text-right font-mono font-semibold whitespace-nowrap text-ink">
                  {formatNumber(order.total)}
                </Td>
                <Td className="text-right font-mono whitespace-nowrap">
                  {order.cancelled ? "—" : formatNumber(order.total - order.paid)}
                </Td>
                <Td className="font-mono text-xs whitespace-nowrap">{order.quotationNumber}</Td>
                {showAssignee && (
                  <Td className="whitespace-nowrap">{order.assignee?.name ?? "—"}</Td>
                )}
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
    </div>
  );
}
