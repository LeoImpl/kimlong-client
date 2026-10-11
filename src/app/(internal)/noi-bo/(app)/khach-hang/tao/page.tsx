import type { Metadata } from "next";
import { CustomerForm, type CustomerDraft } from "@/components/internal/CustomerForm";
import { PageHeader, Panel } from "@/components/internal/PageHeader";
import { Alert } from "@/components/ui/Feedback";
import { requireStaff } from "@/lib/internal/session";
import { internalRoutes } from "@/lib/internal/routes";

export const metadata: Metadata = { title: "Thêm khách hàng" };

/**
 * Internal pages read the session and private data, so a navigation waits for the server (behind the area's
 * `loading.tsx`); they are deliberately not validated as "instant".
 */
export const instant = false;

export default async function NewCustomerPage() {
  await requireStaff();
  const draft: CustomerDraft | undefined = undefined;

  return (
    <>
      <PageHeader
        title="Thêm khách hàng"
        crumbs={[{ label: "Khách hàng", href: internalRoutes.customers }, { label: "Thêm mới" }]}
      />
      <Alert tone="info" className="mb-4">
        Bạn sẽ là nhân viên phụ trách khách hàng này. Chỉ bạn và quản trị viên thấy hồ sơ, báo giá
        và đơn hàng của khách.
      </Alert>
      <Panel>
        <CustomerForm draft={draft} />
      </Panel>
    </>
  );
}
