import { Suspense } from "react";
import { connection } from "next/server";
import { Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { formatPhone, getCompany, primaryHotline, telHref } from "@/lib/api/company";
import { hotlineHours } from "@/lib/copy";
import { routes } from "@/lib/routes";

/**
 * A search with no match. The website lists only part of what Kim Long supplies, so "không tìm thấy" would send
 * the buyer to a competitor: say the item is not listed yet and offer a quote for exactly what they typed.
 */
export function ProductNotListed({ query }: { query: string }) {
  return (
    <EmptyState
      title="Sản phẩm này chưa được cập nhật trên website"
      description={
        `Nhiều mã hàng Kim Long đang phân phối chưa kịp đăng tải. Gửi yêu cầu báo giá cho “${query}” ` +
        "hoặc gọi hotline 24/7 — chúng tôi sẽ kiểm tra và phản hồi trong thời gian sớm nhất."
      }
      action={
        <>
          <ButtonLink href={routes.quoteFor(query)}>Yêu cầu báo giá</ButtonLink>
          <Suspense fallback={null}>
            <CallButton />
          </Suspense>
        </>
      }
    />
  );
}

async function CallButton() {
  await connection();
  const hotline = primaryHotline(await getCompany());
  if (!hotline) return null;
  return (
    <ButtonLink href={telHref(hotline.phone)} variant="secondary" title={hotlineHours.full}>
      <Phone className="size-4" strokeWidth={2} aria-hidden />
      Gọi {formatPhone(hotline.phone)}
    </ButtonLink>
  );
}
