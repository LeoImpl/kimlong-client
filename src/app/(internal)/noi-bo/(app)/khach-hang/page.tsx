import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { FilterBar, FilterField, FilterInput, FilterSelect } from "@/components/internal/Filters";
import { PageHeader } from "@/components/internal/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { Pagination } from "@/components/ui/Pagination";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";
import { getMe, listStaff, searchCustomers } from "@/lib/internal/api";
import { internalRoutes, pageParam, param, withQuery } from "@/lib/internal/routes";

export const metadata: Metadata = { title: "Khách hàng" };

const UNASSIGNED = "chua-co";

export default async function CustomersPage({ searchParams }: PageProps<"/noi-bo/khach-hang">) {
  const params = await searchParams;
  const q = param(params.q);
  const staffId = param(params.sale);
  const includeInactive = param(params.ngung) === "1";
  const me = await getMe();
  const [customers, staff] = await Promise.all([
    searchCustomers({
      q,
      staffId: staffId && staffId !== UNASSIGNED ? staffId : undefined,
      unassigned: staffId === UNASSIGNED,
      includeInactive,
      page: pageParam(params.trang),
    }),
    me.admin ? listStaff() : Promise.resolve([]),
  ]);
  const current = { q, sale: staffId, ngung: includeInactive ? "1" : undefined };

  return (
    <>
      <PageHeader
        title="Khách hàng"
        description={
          me.admin
            ? `${customers.totalItems} khách hàng của toàn công ty`
            : `${customers.totalItems} khách hàng bạn phụ trách`
        }
        actions={
          <ButtonLink href={internalRoutes.newCustomer} size="sm">
            <Plus className="size-4" strokeWidth={2} aria-hidden />
            Thêm khách hàng
          </ButtonLink>
        }
      />

      <FilterBar action={internalRoutes.customers}>
        <FilterField label="Tìm kiếm" className="min-w-64 flex-1">
          <FilterInput
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Tên công ty, MST, người liên hệ, số điện thoại"
          />
        </FilterField>
        {me.admin && (
          <FilterField label="Nhân viên phụ trách" className="w-56">
            <FilterSelect name="sale" defaultValue={staffId ?? ""}>
              <option value="">Tất cả</option>
              <option value={UNASSIGNED}>Chưa có người phụ trách</option>
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
            name="ngung"
            value="1"
            defaultChecked={includeInactive}
            className="size-4 accent-action-600"
          />
          Hiện cả khách đã ngừng
        </label>
      </FilterBar>

      {customers.items.length === 0 ? (
        <EmptyState
          title={q ? "Không tìm thấy khách hàng nào" : "Chưa có khách hàng"}
          description={
            q
              ? "Thử tìm bằng MST hoặc một phần tên công ty. Khách hàng của nhân viên khác không hiển thị ở đây."
              : "Thêm khách hàng đầu tiên để bắt đầu làm báo giá."
          }
          action={
            <ButtonLink href={internalRoutes.newCustomer} size="sm">
              Thêm khách hàng
            </ButtonLink>
          }
        />
      ) : (
        <div className="rounded-lg border border-line bg-page">
          <TableWrap className="mx-0 px-0">
            <Table>
              <thead>
                <tr>
                  <Th>Công ty</Th>
                  <Th>MST</Th>
                  <Th>Người liên hệ</Th>
                  <Th>Ngành nghề</Th>
                  {me.admin && <Th>Phụ trách</Th>}
                </tr>
              </thead>
              <tbody>
                {customers.items.map((customer) => {
                  const contact = customer.contacts[0];
                  return (
                    <Tr key={customer.id}>
                      <Td>
                        <Link
                          href={internalRoutes.customer(customer.id)}
                          className="font-semibold text-action-700 hover:underline"
                        >
                          {customer.companyName}
                        </Link>
                        {!customer.active && (
                          <Badge className="ml-2" tone="neutral">
                            Đã ngừng
                          </Badge>
                        )}
                      </Td>
                      <Td className="font-mono whitespace-nowrap">{customer.taxCode ?? "—"}</Td>
                      <Td>
                        {contact ? (
                          <>
                            <span className="text-ink">{contact.name}</span>
                            {contact.phone && (
                              <span className="ml-2 font-mono text-xs whitespace-nowrap text-muted">
                                {contact.phone}
                              </span>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td>{customer.industry ?? "—"}</Td>
                      {me.admin && (
                        <Td className="whitespace-nowrap">
                          {customer.assignee?.name ?? <span className="text-warning">Chưa có</span>}
                        </Td>
                      )}
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        </div>
      )}

      <div className="mt-4">
        <Pagination
          page={customers.page}
          totalPages={customers.totalPages}
          buildHref={(page) => withQuery(internalRoutes.customers, current, { trang: page + 1 })}
        />
      </div>
    </>
  );
}
