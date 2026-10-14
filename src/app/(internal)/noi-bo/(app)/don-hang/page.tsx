import type { Metadata } from "next";
import { FilterBar, FilterField, FilterInput, FilterSelect } from "@/components/internal/Filters";
import { OrderTable } from "@/components/internal/OrderTable";
import { PageHeader } from "@/components/internal/PageHeader";
import { EmptyState } from "@/components/ui/Feedback";
import { Pagination } from "@/components/ui/Pagination";
import { getMe, listStaff, searchOrders } from "@/lib/internal/api";
import { deliveryStatuses, paymentStatuses } from "@/lib/internal/format";
import { internalRoutes, pageParam, param, withQuery } from "@/lib/internal/routes";
import type { DeliveryStatus, PaymentStatus } from "@/lib/internal/types";

export const metadata: Metadata = { title: "Đơn hàng" };

/**
 * Internal pages read the session and private data, so a navigation waits for the server (behind the area's
 * `loading.tsx`); they are deliberately not validated as "instant".
 */
export const instant = false;

export default async function OrdersPage({ searchParams }: PageProps<"/noi-bo/don-hang">) {
  const params = await searchParams;
  const q = param(params.q);
  const deliveryParam = param(params.giao);
  const delivery =
    deliveryParam && deliveryParam in deliveryStatuses
      ? (deliveryParam as DeliveryStatus)
      : undefined;
  const paymentParam = param(params["thanh-toan"]);
  const payment =
    paymentParam && paymentParam in paymentStatuses ? (paymentParam as PaymentStatus) : undefined;
  const includeCancelled = param(params["da-huy"]) === "1";
  const from = param(params.tu);
  const to = param(params.den);
  const staffId = param(params.sale);
  const me = await getMe();
  const [orders, staff] = await Promise.all([
    searchOrders({
      q,
      delivery,
      payment,
      includeCancelled,
      from,
      to,
      staffId,
      page: pageParam(params.trang),
    }),
    me.admin ? listStaff() : Promise.resolve([]),
  ]);
  const current = {
    q,
    giao: delivery,
    "thanh-toan": payment,
    "da-huy": includeCancelled ? "1" : undefined,
    tu: from,
    den: to,
    sale: staffId,
  };
  const filtered = Boolean(q || delivery || payment || from || to || staffId);

  return (
    <>
      <PageHeader
        title="Đơn hàng"
        description={`${orders.totalItems} đơn hàng${filtered ? " khớp bộ lọc" : ""}. Đơn hàng được tạo khi bấm THẮNG trên một báo giá.`}
      />

      <FilterBar action={internalRoutes.orders}>
        <FilterField label="Tìm kiếm" className="min-w-56 flex-1">
          <FilterInput
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Số đơn, số báo giá, khách hàng, mã hàng"
          />
        </FilterField>
        <FilterField label="Giao hàng" className="w-40">
          <FilterSelect name="giao" defaultValue={delivery ?? ""}>
            <option value="">Tất cả</option>
            {Object.entries(deliveryStatuses).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </FilterSelect>
        </FilterField>
        <FilterField label="Thanh toán" className="w-52">
          <FilterSelect name="thanh-toan" defaultValue={payment ?? ""}>
            <option value="">Tất cả</option>
            {Object.entries(paymentStatuses).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </FilterSelect>
        </FilterField>
        <FilterField label="Từ ngày" className="w-40">
          <FilterInput type="date" name="tu" defaultValue={from} />
        </FilterField>
        <FilterField label="Đến ngày" className="w-40">
          <FilterInput type="date" name="den" defaultValue={to} />
        </FilterField>
        {me.admin && (
          <FilterField label="Nhân viên phụ trách" className="w-52">
            <FilterSelect name="sale" defaultValue={staffId ?? ""}>
              <option value="">Tất cả</option>
              {staff.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.name}
                </option>
              ))}
            </FilterSelect>
          </FilterField>
        )}
        <label className="flex h-10 items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="da-huy"
            value="1"
            defaultChecked={includeCancelled}
            className="size-4 accent-action-600"
          />
          Hiện cả đơn đã hủy
        </label>
      </FilterBar>

      {orders.items.length === 0 ? (
        <EmptyState
          title={filtered ? "Không có đơn hàng nào khớp bộ lọc" : "Chưa có đơn hàng"}
          description="Mở một báo giá đã gửi và bấm THẮNG khi khách chốt: đơn hàng được tạo với toàn bộ dòng hàng của báo giá."
        />
      ) : (
        <OrderTable orders={orders.items} showAssignee={me.admin} />
      )}

      <div className="mt-4">
        <Pagination
          page={orders.page}
          totalPages={orders.totalPages}
          buildHref={(page) => withQuery(internalRoutes.orders, current, { trang: page + 1 })}
        />
      </div>
    </>
  );
}
