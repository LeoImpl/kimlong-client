import type { Metadata } from "next";
import { QuickOrder } from "@/components/quick-order/QuickOrder";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Đặt hàng nhanh theo mã",
  description:
    "Nhập, dán từ Excel hoặc tải lên file CSV danh sách mã sản phẩm và số lượng để gửi yêu cầu báo giá một lần.",
  alternates: { canonical: routes.quickOrder },
  // A tool, not content: nothing on it is worth a search result of its own.
  robots: { index: false, follow: true },
};

/**
 * Quick order for buyers who already have the part numbers — typically a maintenance list kept in Excel. The
 * page itself is static; the grid is a client component and checks part numbers through a server action.
 */
export default function QuickOrderPage() {
  return (
    <Container className="py-6 lg:py-10">
      <Breadcrumb items={[{ name: "Trang chủ", href: routes.home }, { name: "Đặt hàng nhanh" }]} />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[2rem] leading-tight sm:text-[2.5rem]">Đặt hàng nhanh theo mã</h1>
          <p className="mt-2 max-w-2xl text-body">
            Nhập mã sản phẩm và số lượng, dán thẳng từ Excel hoặc tải lên file CSV. Mã được đối
            chiếu với danh mục ngay khi bạn nhập.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <QuickOrder />
      </div>
    </Container>
  );
}
