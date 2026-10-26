import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  HandCoins,
  ReceiptText,
  Send,
  Trophy,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { FilterBar, FilterField, FilterSelect } from "@/components/internal/Filters";
import { PageHeader, Panel } from "@/components/internal/PageHeader";
import { RevenueChart } from "@/components/internal/RevenueChart";
import { EmptyState } from "@/components/ui/Feedback";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";
import { cn } from "@/lib/cn";
import { getCustomerRevenue, getMe, getOverview, getRevenue, listStaff } from "@/lib/internal/api";
import { formatNumber, formatVnd, periodLabel, todayIso } from "@/lib/internal/format";
import { internalRoutes, param, withQuery } from "@/lib/internal/routes";

export const metadata: Metadata = { title: "Tổng quan" };

/**
 * Internal pages read the session and private data, so a navigation waits for the server (behind the area's
 * `loading.tsx`); they are deliberately not validated as "instant".
 */
export const instant = false;

interface Tile {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  /** Two ends of the tile's gradient; the `to` end is dark enough for the gradient value to stay readable. */
  from: string;
  to: string;
}

/** One colour family per figure, so the eye finds "doanh thu" or "khách hàng" by colour on the second visit. */
const hues = {
  cyan: { icon: Building2, from: "#06b6d4", to: "#0e7490" },
  blue: { icon: Send, from: "#3b82f6", to: "#4338ca" },
  violet: { icon: ReceiptText, from: "#a855f7", to: "#6d28d9" },
  pink: { icon: TrendingUp, from: "#ec4899", to: "#be185d" },
  orange: { icon: HandCoins, from: "#f59e0b", to: "#c2410c" },
  green: { icon: Trophy, from: "#10b981", to: "#047857" },
} satisfies Record<string, Pick<Tile, "icon" | "from" | "to">>;

const granularities = { month: "Tháng", quarter: "Quý", year: "Năm" } as const;
type Granularity = keyof typeof granularities;

export default async function DashboardPage({ searchParams }: PageProps<"/noi-bo">) {
  const params = await searchParams;
  const me = await getMe();
  const thisYear = Number(todayIso().slice(0, 4));
  const yearParam = Number(param(params.nam));
  const year =
    Number.isInteger(yearParam) && yearParam >= 2000 && yearParam <= 2100 ? yearParam : thisYear;
  const byParam = param(params.theo);
  const by: Granularity = byParam === "quarter" || byParam === "year" ? byParam : "month";
  const gross = param(params.vat) === "sau";
  // Only administrators choose whose figures to see; the platform ignores the filter for anyone else.
  const staffId = me.admin ? param(params.sale) : undefined;
  const query = { year, staffId };
  const [overview, revenue, customers, staff] = await Promise.all([
    getOverview(query),
    getRevenue(by, query),
    getCustomerRevenue(query),
    me.admin ? listStaff() : Promise.resolve([]),
  ]);
  const current = {
    nam: year === thisYear ? undefined : String(year),
    theo: by === "month" ? undefined : by,
    vat: gross ? "sau" : undefined,
    sale: staffId,
  };
  const href = (changes: Record<string, string | undefined>) =>
    withQuery(internalRoutes.dashboard, current, changes);
  const scope = staffId
    ? `Khách hàng của ${staff.find((member) => member.userId === staffId)?.name ?? "nhân viên đã chọn"}`
    : me.admin
      ? "Toàn công ty"
      : "Khách hàng bạn phụ trách";
  const measure = gross ? "revenueGross" : "revenueNet";

  const tiles: Tile[] = [
    {
      label: "Khách hàng",
      value: formatNumber(overview.customers),
      detail: "Đang giao dịch",
      ...hues.cyan,
    },
    {
      label: "Báo giá đã gửi",
      value: formatNumber(overview.quotationsSent),
      detail: `Năm ${year}`,
      ...hues.blue,
    },
    {
      label: "Giá trị báo giá",
      value: formatVnd(overview.quotationValueNet),
      detail: `Sau VAT ${formatVnd(overview.quotationValueGross)}`,
      ...hues.violet,
    },
    {
      label: "Doanh thu trước VAT",
      value: formatVnd(overview.revenueNet),
      detail: "Đơn không hủy, theo ngày đặt",
      ...hues.pink,
    },
    {
      label: "Doanh thu sau VAT",
      value: formatVnd(overview.revenueGross),
      detail: `Còn phải thu ${formatVnd(overview.outstanding)}`,
      ...hues.orange,
    },
    {
      label: "Đơn hàng đã chốt",
      value: formatNumber(overview.ordersWon),
      detail: `Năm ${year}`,
      ...hues.green,
    },
  ];

  return (
    <>
      <PageHeader title="Tổng quan" description={`${scope} · năm ${year}`} />

      <FilterBar action={internalRoutes.dashboard}>
        <FilterField label="Năm" className="w-32">
          <FilterSelect name="nam" defaultValue={String(year)}>
            {Array.from({ length: 6 }, (_, index) => thisYear - index).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>
        </FilterField>
        {me.admin && (
          <FilterField label="Nhân viên" className="w-56">
            <FilterSelect name="sale" defaultValue={staffId ?? ""}>
              <option value="">Toàn công ty</option>
              {staff.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.name}
                </option>
              ))}
            </FilterSelect>
          </FilterField>
        )}
        {by !== "month" && <input type="hidden" name="theo" value={by} />}
        {gross && <input type="hidden" name="vat" value="sau" />}
      </FilterBar>

      <dl className="stagger mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile, index) => (
          <div
            key={tile.label}
            style={
              {
                "--i": index,
                "--hue-from": tile.from,
                "--hue-to": tile.to,
              } as React.CSSProperties
            }
            className="hover-lift relative overflow-hidden rounded-lg border border-line bg-page px-4 py-3.5"
          >
            {/* A wash of the tile's colour in the corner, and a bar of it along the top. */}
            <span
              className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-linear-to-br from-(--hue-from) to-(--hue-to) opacity-15 blur-xl"
              aria-hidden
            />
            <span
              className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-(--hue-from) to-(--hue-to)"
              aria-hidden
            />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
                  {tile.label}
                </dt>
                <dd className="text-gradient mt-1 font-mono text-2xl font-semibold">
                  {tile.value}
                </dd>
                <dd className="mt-0.5 text-xs text-muted">{tile.detail}</dd>
              </div>
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-(--hue-from) to-(--hue-to) text-white shadow-[0_8px_18px_-8px_var(--hue-to)]"
                aria-hidden
              >
                <tile.icon className="size-5" strokeWidth={2} />
              </span>
            </div>
          </div>
        ))}
      </dl>

      <Panel
        title={`Doanh thu ${gross ? "sau" : "trước"} VAT theo ${granularities[by].toLowerCase()}`}
        actions={
          <>
            <Toggle
              label="Khoảng thời gian"
              options={Object.entries(granularities).map(([value, label]) => ({
                label,
                href: href({ theo: value === "month" ? undefined : value }),
                active: by === value,
              }))}
            />
            <Toggle
              label="Doanh thu"
              options={[
                { label: "Trước VAT", href: href({ vat: undefined }), active: !gross },
                { label: "Sau VAT", href: href({ vat: "sau" }), active: gross },
              ]}
            />
          </>
        }
        className="mb-4"
      >
        <RevenueChart
          points={revenue}
          measure={measure}
          title={`Doanh thu ${gross ? "sau" : "trước"} VAT theo ${granularities[by].toLowerCase()}`}
        />
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-action-600">
            Xem bảng số liệu
          </summary>
          <TableWrap className="mx-0 mt-2 px-0">
            <Table>
              <thead>
                <tr>
                  <Th>Kỳ</Th>
                  <Th className="text-right">Số đơn</Th>
                  <Th className="text-right">Trước VAT</Th>
                  <Th className="text-right">Sau VAT</Th>
                </tr>
              </thead>
              <tbody>
                {revenue.map((point) => (
                  <Tr key={point.period}>
                    <Td className="font-mono">
                      {periodLabel(point)}
                      {point.index !== null ? `/${point.year}` : ""}
                    </Td>
                    <Td className="text-right font-mono">{formatNumber(point.orders)}</Td>
                    <Td className="text-right font-mono">{formatNumber(point.revenueNet)}</Td>
                    <Td className="text-right font-mono">{formatNumber(point.revenueGross)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </details>
      </Panel>

      <Panel title={`Doanh thu theo khách hàng · năm ${year}`} bodyClassName="p-0">
        {customers.length === 0 ? (
          <div className="p-4">
            <EmptyState title="Chưa có báo giá hay đơn hàng nào trong năm này" />
          </div>
        ) : (
          <TableWrap className="mx-0 px-0">
            <Table>
              <thead>
                <tr>
                  <Th>Khách hàng</Th>
                  {me.admin && <Th>Phụ trách</Th>}
                  <Th className="text-right">Báo giá đã gửi</Th>
                  <Th className="text-right">Đơn hàng</Th>
                  <Th className="text-right">Trước VAT</Th>
                  <Th className="text-right">Sau VAT</Th>
                  <Th className="text-right">Còn phải thu</Th>
                </tr>
              </thead>
              <tbody>
                {customers.map((row) => (
                  <Tr key={row.customerId}>
                    <Td>
                      <Link
                        href={internalRoutes.customer(row.customerId)}
                        className="font-semibold text-action-700 hover:underline"
                      >
                        {row.customerName}
                      </Link>
                    </Td>
                    {me.admin && <Td className="whitespace-nowrap">{row.assignee?.name ?? "—"}</Td>}
                    <Td className="text-right font-mono">{formatNumber(row.quotationsSent)}</Td>
                    <Td className="text-right font-mono">{formatNumber(row.orders)}</Td>
                    <Td className="text-right font-mono whitespace-nowrap">
                      {formatNumber(row.revenueNet)}
                    </Td>
                    <Td className="text-right font-mono font-semibold whitespace-nowrap text-ink">
                      {formatNumber(row.revenueGross)}
                    </Td>
                    <Td className="text-right font-mono whitespace-nowrap">
                      {formatNumber(row.outstanding)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Panel>
    </>
  );
}

/** A segmented control made of links: each choice is a URL, so the view can be bookmarked. */
function Toggle({
  label,
  options,
}: {
  label: string;
  options: { label: string; href: string; active: boolean }[];
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-full border border-line bg-surface p-0.5"
    >
      {options.map((option) => (
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
  );
}
