import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { QuoteForm } from "@/components/quote/QuoteForm";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Feedback";
import { getCompany, primaryHotline } from "@/lib/api/company";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Yêu cầu báo giá",
  description: "Gửi danh sách mã sản phẩm và số lượng, Kim Long báo giá trong giờ làm việc.",
  // The basket only exists in the visitor's browser, so there is nothing here for a search engine to index.
  robots: { index: false, follow: true },
};

export default function QuotePage() {
  return (
    <Container className="py-6 lg:py-10">
      <Breadcrumb items={[{ name: "Trang chủ", href: routes.home }, { name: "Yêu cầu báo giá" }]} />
      <h1 className="mt-4 text-[2rem] leading-tight sm:text-[2.5rem]">Yêu cầu báo giá</h1>
      <p className="mt-2 max-w-2xl text-body">
        Kiểm tra lại danh sách, điền thông tin liên hệ và gửi. Chúng tôi phản hồi trong giờ làm
        việc.
      </p>

      <Suspense fallback={<Skeleton className="mt-8 h-96" />}>
        <Form />
      </Suspense>
    </Container>
  );
}

async function Form() {
  await connection();
  const company = await getCompany();
  return <QuoteForm hotline={primaryHotline(company)?.phone ?? null} />;
}
