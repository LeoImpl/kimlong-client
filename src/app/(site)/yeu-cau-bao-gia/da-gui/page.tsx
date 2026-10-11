import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Feedback";
import { formatPhone, getCompany, primaryHotline, telHref, zaloHref } from "@/lib/api/company";
import { routes } from "@/lib/routes";

/**
 * Confirmation. A separate URL rather than a panel on the form, for two reasons: the reference survives a
 * refresh or a shared link, and "reached /yeu-cau-bao-gia/da-gui" is the one analytics goal that matters
 * (Phase 6).
 *
 * There is no tracking link in v1 — the reference plus the confirmation e-mail is what a guest has — so the
 * reference is shown large and is selectable.
 */
export const metadata: Metadata = {
  title: "Đã gửi yêu cầu",
  robots: { index: false, follow: false },
};

export default function QuoteSentPage({ searchParams }: PageProps<"/yeu-cau-bao-gia/da-gui">) {
  return (
    <Container className="py-12 lg:py-20">
      <div className="mx-auto max-w-xl text-center">
        <span
          className="inline-flex size-14 items-center justify-center rounded-full bg-success-soft"
          aria-hidden
        >
          <svg
            viewBox="0 0 24 24"
            className="size-7 text-success"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="m5 12.5 4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>

        <h1 className="mt-5 text-[2rem] leading-tight sm:text-[2.5rem]">Đã gửi yêu cầu</h1>
        <p className="mt-3 text-body">
          Cảm ơn bạn. Chúng tôi đã nhận được yêu cầu và sẽ phản hồi qua email trong giờ làm việc.
        </p>

        <Suspense fallback={<Skeleton className="mx-auto mt-6 h-20 w-72" />}>
          <Reference searchParams={searchParams} />
        </Suspense>

        <ol className="mt-8 space-y-2 text-left text-sm text-body">
          <Step number={1}>Bộ phận kinh doanh kiểm tra tồn kho và giá.</Step>
          <Step number={2}>Bạn nhận báo giá qua email, kèm thời gian giao hàng.</Step>
          <Step number={3}>Nếu cần làm rõ thông số, chúng tôi gọi lại theo số bạn để lại.</Step>
        </ol>

        <Suspense fallback={null}>
          <Hotline />
        </Suspense>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href={routes.products}>Tiếp tục xem sản phẩm</ButtonLink>
          <ButtonLink href={routes.home} variant="secondary">
            Về trang chủ
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}

async function Reference({
  searchParams,
}: {
  searchParams: PageProps<"/yeu-cau-bao-gia/da-gui">["searchParams"];
}) {
  const { ref } = await searchParams;
  const reference = Array.isArray(ref) ? ref[0] : ref;
  if (!reference) return null;

  return (
    <div className="mt-6 rounded-lg border border-line bg-page px-6 py-4">
      <p className="text-sm text-muted">Mã yêu cầu của bạn</p>
      <p className="mt-1 font-mono text-xl font-semibold text-ink select-all">{reference}</p>
      <p className="mt-2 text-xs text-muted">
        Vui lòng giữ lại mã này để tiện tra cứu khi liên hệ.
      </p>
    </div>
  );
}

async function Hotline() {
  await connection();
  const hotline = primaryHotline(await getCompany());
  if (!hotline) return null;

  return (
    <p className="mt-8 text-sm text-body">
      Cần gấp?{" "}
      <a href={telHref(hotline.phone)} className="font-semibold text-action-600 hover:underline">
        Gọi {formatPhone(hotline.phone)}
      </a>{" "}
      hoặc{" "}
      <a
        href={zaloHref(hotline.phone)}
        target="_blank"
        rel="noopener"
        className="font-semibold text-action-600 hover:underline"
      >
        chat Zalo
      </a>
      .
    </p>
  );
}

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-action-50 text-xs font-semibold text-action-700">
        {number}
      </span>
      {children}
    </li>
  );
}
