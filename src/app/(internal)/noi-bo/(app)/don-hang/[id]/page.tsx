import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderWorkspace } from "@/components/internal/OrderWorkspace";
import { PageHeader } from "@/components/internal/PageHeader";
import { DeliveryStatusBadge, PaymentStatusBadge } from "@/components/internal/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Feedback";
import { getOrder, getSettings } from "@/lib/internal/api";
import { formatDay, formatInstant, todayIso } from "@/lib/internal/format";
import { internalRoutes } from "@/lib/internal/routes";

export const metadata: Metadata = { title: "Đơn hàng" };

/**
 * Internal pages read the session and private data, so a navigation waits for the server (behind the area's
 * `loading.tsx`); they are deliberately not validated as "instant".
 */
export const instant = false;

export default async function OrderPage({ params }: PageProps<"/noi-bo/don-hang/[id]">) {
  const { id } = await params;
  const order = await getOrder(id);
  // Also the answer for an order of another salesperson's customer.
  if (!order) notFound();
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{order.number}</span>
            {order.cancelled ? (
              <Badge tone="danger">Đã hủy</Badge>
            ) : (
              <>
                <DeliveryStatusBadge status={order.deliveryStatus} />
                <PaymentStatusBadge status={order.paymentStatus} />
              </>
            )}
          </span>
        }
        description={
          <>
            <Link
              href={internalRoutes.customer(order.customerId)}
              className="font-medium text-ink hover:text-action-700 hover:underline"
            >
              {order.customer.companyName}
            </Link>{" "}
            · Đặt ngày {formatDay(order.orderDate)} · Từ báo giá{" "}
            <Link
              href={internalRoutes.quotation(order.quotationId)}
              className="font-mono font-medium text-action-600 hover:underline"
            >
              {order.quotationNumber}
            </Link>
          </>
        }
        crumbs={[{ label: "Đơn hàng", href: internalRoutes.orders }, { label: order.number }]}
      />
      {order.cancelled && (
        <Alert
          tone="danger"
          title={`Đơn hàng đã hủy lúc ${formatInstant(order.cancelledAt)}`}
          className="mb-4"
        >
          {order.cancelReason ?? "Chưa ghi lý do."} Đơn đã hủy không tính vào doanh thu.
        </Alert>
      )}
      {/* Remounted for another order, so nothing typed into one leaks into the next. */}
      <OrderWorkspace key={order.id} order={order} settings={settings} today={todayIso()} />
    </>
  );
}
