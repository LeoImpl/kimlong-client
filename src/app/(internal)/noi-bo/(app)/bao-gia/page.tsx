import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { FilterBar, FilterField, FilterInput, FilterSelect } from "@/components/internal/Filters";
import { PageHeader } from "@/components/internal/PageHeader";
import { QuotationTable } from "@/components/internal/QuotationTable";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { Pagination } from "@/components/ui/Pagination";
import { getMe, listStaff, searchQuotations } from "@/lib/internal/api";
import { quotationStatuses } from "@/lib/internal/format";
import { internalRoutes, pageParam, param, withQuery } from "@/lib/internal/routes";
import type { QuotationStatus } from "@/lib/internal/types";

export const metadata: Metadata = { title: "Báo giá" };

/**
 * Internal pages read the session and private data, so a navigation waits for the server (behind the area's
 * `loading.tsx`); they are deliberately not validated as "instant".
 */
export const instant = false;

export default async function QuotationsPage({ searchParams }: PageProps<"/noi-bo/bao-gia">) {
  const params = await searchParams;
  const q = param(params.q);
  const statusParam = param(params["trang-thai"]);
  const status =
    statusParam && statusParam in quotationStatuses ? (statusParam as QuotationStatus) : undefined;
  const from = param(params.tu);
  const to = param(params.den);
  const staffId = param(params.sale);
  const me = await getMe();
  const [quotations, staff] = await Promise.all([
    searchQuotations({ q, status, from, to, staffId, page: pageParam(params.trang) }),
    me.admin ? listStaff() : Promise.resolve([]),
  ]);
  const current = { q, "trang-thai": status, tu: from, den: to, sale: staffId };
  const filtered = Boolean(q || status || from || to || staffId);

  return (
    <>
      <PageHeader
        title="Báo giá"
        description={`${quotations.totalItems} báo giá${filtered ? " khớp bộ lọc" : ""}`}
        actions={
          <ButtonLink href={internalRoutes.newQuotation} size="sm">
            <Plus className="size-4" strokeWidth={2} aria-hidden />
            Tạo báo giá
          </ButtonLink>
        }
      />

      <FilterBar action={internalRoutes.quotations}>
        <FilterField label="Tìm kiếm" className="min-w-56 flex-1">
          <FilterInput
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Số báo giá, khách hàng, MST, mã hàng"
          />
        </FilterField>
        <FilterField label="Trạng thái" className="w-48">
          <FilterSelect name="trang-thai" defaultValue={status ?? ""}>
            <option value="">Tất cả</option>
            {Object.entries(quotationStatuses).map(([value, { label }]) => (
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
      </FilterBar>

      {quotations.items.length === 0 ? (
        <EmptyState
          title={filtered ? "Không có báo giá nào khớp bộ lọc" : "Chưa có báo giá"}
          description={
            filtered
              ? "Thử bỏ bớt điều kiện lọc. Báo giá của khách do nhân viên khác phụ trách không hiển thị ở đây."
              : "Tạo báo giá đầu tiên cho một khách hàng đã lưu."
          }
          action={
            <ButtonLink href={internalRoutes.newQuotation} size="sm">
              Tạo báo giá
            </ButtonLink>
          }
        />
      ) : (
        <QuotationTable quotations={quotations.items} showAssignee={me.admin} />
      )}

      <div className="mt-4">
        <Pagination
          page={quotations.page}
          totalPages={quotations.totalPages}
          buildHref={(page) => withQuery(internalRoutes.quotations, current, { trang: page + 1 })}
        />
      </div>
    </>
  );
}
