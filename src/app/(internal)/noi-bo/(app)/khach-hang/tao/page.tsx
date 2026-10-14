import type { Metadata } from "next";
import { CustomerForm, type CustomerDraft } from "@/components/internal/CustomerForm";
import { PageHeader, Panel } from "@/components/internal/PageHeader";
import { Alert } from "@/components/ui/Feedback";
import { getWebRequest } from "@/lib/internal/api";
import { requireStaff } from "@/lib/internal/session";
import { internalRoutes, param } from "@/lib/internal/routes";

export const metadata: Metadata = { title: "Thêm khách hàng" };

/**
 * Internal pages read the session and private data, so a navigation waits for the server (behind the area's
 * `loading.tsx`); they are deliberately not validated as "instant".
 */
export const instant = false;

export default async function NewCustomerPage({
  searchParams,
}: PageProps<"/noi-bo/khach-hang/tao">) {
  await requireStaff();
  // Coming from a website request: the form starts with what the requester typed, and saving returns there.
  const requestId = param((await searchParams)["tu-yeu-cau"]);
  const request = requestId ? await getWebRequest(requestId) : null;
  const draft: CustomerDraft | undefined = request
    ? {
        companyName: request.company ?? request.contactName,
        taxCode: request.taxCode ?? undefined,
        taxAddress: request.address ?? undefined,
        contacts: [{ name: request.contactName, phone: request.phone, email: request.email }],
      }
    : undefined;

  return (
    <>
      <PageHeader
        title="Thêm khách hàng"
        crumbs={[{ label: "Khách hàng", href: internalRoutes.customers }, { label: "Thêm mới" }]}
      />
      {request && (
        <Alert tone="success" className="mb-4">
          Điền sẵn từ yêu cầu <span className="font-mono font-semibold">{request.reference}</span>.
          Sau khi lưu, bạn quay lại yêu cầu để tạo báo giá.
        </Alert>
      )}
      <Alert tone="info" className="mb-4">
        Bạn sẽ là nhân viên phụ trách khách hàng này. Chỉ bạn và quản trị viên thấy hồ sơ, báo giá
        và đơn hàng của khách.
      </Alert>
      <Panel>
        <CustomerForm
          draft={draft}
          afterSave={request ? internalRoutes.webRequest(request.id) : undefined}
        />
      </Panel>
    </>
  );
}
