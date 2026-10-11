import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AssigneeControl } from "@/components/internal/AssigneeControl";
import { CustomerForm } from "@/components/internal/CustomerForm";
import { PageHeader, Panel } from "@/components/internal/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { getCustomer, getMe, listStaff } from "@/lib/internal/api";
import { formatInstant } from "@/lib/internal/format";
import { internalRoutes, param } from "@/lib/internal/routes";

export const metadata: Metadata = { title: "Hồ sơ khách hàng" };

const tabs = [{ key: "thong-tin", label: "Thông tin" }] as const;

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

      <div className="space-y-4">
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
