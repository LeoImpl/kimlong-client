import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { AssigneeControl } from "@/components/internal/AssigneeControl";
import { CreateFrameworkButton } from "@/components/internal/CreateFrameworkButton";
import { CustomerForm } from "@/components/internal/CustomerForm";
import { PaperRow } from "@/components/internal/OrderPapers";
import { PageHeader, Panel } from "@/components/internal/PageHeader";
import { OrderTable } from "@/components/internal/OrderTable";
import { QuotationTable } from "@/components/internal/QuotationTable";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { cn } from "@/lib/cn";
import {
  getCustomer,
  getCustomerSummary,
  getMe,
  listFrameworkContracts,
  listStaff,
  searchOrders,
  searchQuotations,
} from "@/lib/internal/api";
import { formatDay, formatInstant, formatNumber, formatVnd } from "@/lib/internal/format";
import { internalRoutes, param } from "@/lib/internal/routes";

export const metadata: Metadata = { title: "Hồ sơ khách hàng" };

/**
 * Internal pages read the session and private data, so a navigation waits for the server (behind the area's
 * `loading.tsx`); they are deliberately not validated as "instant".
 */
export const instant = false;

const tabs = [
  { key: "thong-tin", label: "Thông tin" },
  { key: "bao-gia", label: "Báo giá" },
  { key: "don-hang", label: "Đơn hàng" },
  { key: "hop-dong", label: "Hợp đồng nguyên tắc" },
] as const;

export default async function CustomerPage({
  params,
  searchParams,
}: PageProps<"/noi-bo/khach-hang/[id]">) {
  const { id } = await params;
  const tab = param((await searchParams).tab) ?? "thong-tin";
  const [customer, me] = await Promise.all([getCustomer(id), getMe()]);
  // Also the answer for a customer of another salesperson: the platform says 404 for both.
  if (!customer) notFound();
  const staff = me.admin ? await listStaff() : [];

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {customer.companyName}
            {!customer.active && <Badge tone="neutral">Đã ngừng</Badge>}
          </span>
        }
        description={
          <>
            {customer.taxCode ? (
              <>
                MST <span className="font-mono text-ink">{customer.taxCode}</span> ·{" "}
              </>
            ) : null}
            Phụ trách: <span className="text-ink">{customer.assignee?.name ?? "chưa có"}</span> ·
            Tạo lúc {formatInstant(customer.createdAt)}
          </>
        }
        crumbs={[
          { label: "Khách hàng", href: internalRoutes.customers },
          { label: customer.companyName },
        ]}
      />

      <CustomerFigures customerId={customer.id} />

      <nav aria-label="Hồ sơ khách hàng" className="mb-4 flex gap-1 border-b border-line">
        {tabs.map((item) => (
          <Link
            key={item.key}
            href={`${internalRoutes.customer(customer.id)}?tab=${item.key}`}
            aria-current={tab === item.key ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium",
              tab === item.key
                ? "border-action-600 text-action-700"
                : "border-transparent text-muted hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {tab === "bao-gia" && (
        <CustomerQuotations customerId={customer.id} active={customer.active} />
      )}
      {tab === "don-hang" && <CustomerOrders customerId={customer.id} />}
      {tab === "hop-dong" && <CustomerFrameworks customerId={customer.id} />}

      <div className={cn("space-y-4", tab !== "thong-tin" && "hidden")}>
        {me.admin && (
          <Panel title="Nhân viên phụ trách">
            <AssigneeControl customer={customer} staff={staff} />
          </Panel>
        )}
        <Panel title="Thông tin khách hàng">
          <CustomerForm customer={customer} />
        </Panel>
      </div>
    </>
  );
}

async function CustomerQuotations({ customerId, active }: { customerId: string; active: boolean }) {
  const quotations = await searchQuotations({ customerId, size: 100 });
  const create = active ? (
    <ButtonLink href={internalRoutes.newQuotationFor(customerId)} size="sm">
      <Plus className="size-4" strokeWidth={2} aria-hidden />
      Tạo báo giá cho khách này
    </ButtonLink>
  ) : null;
  if (quotations.items.length === 0) {
    return <EmptyState title="Chưa có báo giá cho khách hàng này" action={create} />;
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{quotations.totalItems} báo giá, mới nhất trước</p>
        {create}
      </div>
      <QuotationTable quotations={quotations.items} showCustomer={false} />
    </div>
  );
}

async function CustomerOrders({ customerId }: { customerId: string }) {
  const orders = await searchOrders({ customerId, includeCancelled: true, size: 100 });
  if (orders.items.length === 0) {
    return (
      <EmptyState
        title="Chưa có đơn hàng của khách hàng này"
        description="Đơn hàng được tạo khi bấm THẮNG trên một báo giá đã gửi."
      />
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        {orders.totalItems} đơn hàng, mới nhất trước (gồm cả đơn đã hủy)
      </p>
      <OrderTable orders={orders.items} showCustomer={false} />
    </div>
  );
}

/** The customer at a glance: what was quoted, what was won, and what is still owed. */
async function CustomerFigures({ customerId }: { customerId: string }) {
  const summary = await getCustomerSummary(customerId);
  const quotations =
    summary.quotationsDraft +
    summary.quotationsOpen +
    summary.quotationsWon +
    summary.quotationsLost;
  const figures = [
    {
      label: "Báo giá",
      value: formatNumber(quotations),
      detail: `${summary.quotationsOpen} đang mở · ${summary.quotationsWon} đã chốt · ${summary.quotationsLost} không thành công`,
    },
    {
      label: "Đơn hàng",
      value: formatNumber(summary.orders),
      detail: summary.lastOrderDate
        ? `Gần nhất ${formatDay(summary.lastOrderDate)}`
        : "Chưa có đơn",
    },
    {
      label: "Doanh thu trước VAT",
      value: formatVnd(summary.revenueNet),
      detail: `Sau VAT ${formatVnd(summary.revenueGross)}`,
    },
    {
      label: "Còn phải thu",
      value: formatVnd(summary.outstanding),
      detail: `Đã thu ${formatVnd(summary.paid)}`,
    },
  ];
  return (
    <dl className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {figures.map((figure) => (
        <div key={figure.label} className="rounded-lg border border-line bg-page px-4 py-3">
          <dt className="text-xs font-medium text-muted">{figure.label}</dt>
          <dd className="mt-1 font-mono text-xl font-semibold text-ink">{figure.value}</dd>
          <dd className="mt-0.5 text-xs text-muted">{figure.detail}</dd>
        </div>
      ))}
    </dl>
  );
}

async function CustomerFrameworks({ customerId }: { customerId: string }) {
  const frameworks = await listFrameworkContracts(customerId);
  return (
    <Panel
      title="Hợp đồng nguyên tắc"
      actions={<CreateFrameworkButton customerId={customerId} />}
      bodyClassName="space-y-2"
    >
      {frameworks.length === 0 ? (
        <p className="text-sm text-muted">
          Chưa có hợp đồng nguyên tắc. Khi có, mỗi đơn hàng thắng của khách có thể đưa vào hợp đồng
          này dưới dạng một phụ lục (ở trang đơn hàng, mục Chứng từ).
        </p>
      ) : (
        <ul className="space-y-2">
          {frameworks.map((framework) => (
            <li key={framework.id}>
              <PaperRow paper={framework} frameworks={frameworks} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
