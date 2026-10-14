import { ButtonLink } from "@/components/ui/Button";
import { internalRoutes } from "@/lib/internal/routes";

/** Also what a salesperson sees for a record that belongs to a colleague: the platform answers 404 for both. */
export default function InternalNotFound() {
  return (
    <div className="rounded-lg border border-dashed border-line-strong bg-page px-6 py-12 text-center">
      <h1 className="text-2xl">Không tìm thấy</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-body">
        Bản ghi này không tồn tại, hoặc thuộc khách hàng do nhân viên khác phụ trách.
      </p>
      <div className="mt-5 flex justify-center">
        <ButtonLink href={internalRoutes.dashboard} size="sm" variant="secondary">
          Về trang tổng quan
        </ButtonLink>
      </div>
    </div>
  );
}
