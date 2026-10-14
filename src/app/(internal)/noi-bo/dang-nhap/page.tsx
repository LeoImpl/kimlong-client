import type { Metadata } from "next";
import { Suspense } from "react";
import { LockKeyhole } from "lucide-react";
import { Alert } from "@/components/ui/Feedback";
import { AUTH_START_PATH, safeNextPath } from "@/lib/internal/tokens";

export const metadata: Metadata = { title: "Đăng nhập" };

const errors: Record<string, string> = {
  "het-han": "Phiên đăng nhập đã quá hạn. Vui lòng bấm đăng nhập lại.",
  "dang-nhap": "Đăng nhập không thành công. Vui lòng thử lại.",
  "may-chu": "Chưa kết nối được máy chủ đăng nhập. Vui lòng thử lại sau ít phút.",
  "qua-nhieu": "Quá nhiều lần đăng nhập từ địa chỉ này. Vui lòng đợi vài phút rồi thử lại.",
};

export default function LoginPage({ searchParams }: PageProps<"/noi-bo/dang-nhap">) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-line bg-page p-8 shadow-[0_1px_2px_rgb(28_34_39/0.08)]">
        <div className="flex items-center gap-3">
          <span
            className="flex size-11 items-center justify-center rounded-lg bg-navy text-brand-300"
            aria-hidden
          >
            <LockKeyhole className="size-5" strokeWidth={1.75} />
          </span>
          <div>
            <p className="font-display text-2xl leading-none font-semibold text-ink">Kim Long</p>
            <p className="mt-1 text-sm text-muted">Khu vực nội bộ</p>
          </div>
        </div>
        <h1 className="mt-8 text-2xl">Đăng nhập</h1>
        <p className="mt-2 text-sm text-body">
          Dành cho nhân viên kinh doanh của Kim Long. Tài khoản do quản trị viên cấp.
        </p>
        {/* The query string is request data: it streams in behind the boundary, the frame above is static. */}
        <Suspense fallback={<LoginButton href={AUTH_START_PATH} />}>
          <LoginForm searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function LoginForm({ searchParams }: Pick<PageProps<"/noi-bo/dang-nhap">, "searchParams">) {
  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const next = safeNextPath(first(params.next));
  const error = errors[first(params.loi) ?? ""];
  const href =
    next === "/noi-bo" ? AUTH_START_PATH : `${AUTH_START_PATH}?next=${encodeURIComponent(next)}`;
  return (
    <>
      {error && (
        <Alert tone="danger" className="mt-5">
          {error}
        </Alert>
      )}
      {!error && first(params["da-dang-xuat"]) && (
        <Alert tone="success" className="mt-5">
          Bạn đã đăng xuất.
        </Alert>
      )}
      <LoginButton href={href} />
    </>
  );
}

function LoginButton({ href }: { href: string }) {
  // A plain link, not `next/link`: this is a route handler that redirects to Keycloak, and must never be prefetched.
  return (
    <a
      href={href}
      className="mt-6 flex h-12 w-full items-center justify-center rounded-[5px] bg-action-600 text-base font-bold text-white transition-colors hover:bg-action-700"
    >
      Đăng nhập
    </a>
  );
}
