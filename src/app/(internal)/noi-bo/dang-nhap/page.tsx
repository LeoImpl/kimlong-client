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
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-line bg-page/90 p-8 shadow-[0_24px_60px_-28px_rgb(37_99_235/0.5)] backdrop-blur">
        <span
          className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-[#1d4ed8] via-[#3b82f6] to-[#06b6d4]"
          aria-hidden
        />
        <div className="flex items-center gap-3">
          <span
            className="flex size-11 items-center justify-center rounded-xl bg-linear-to-br from-[#1d4ed8] via-[#3b82f6] to-[#06b6d4] text-white shadow-[0_8px_20px_-8px_rgb(59_130_246/0.8)]"
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
      className="mt-6 flex h-12 w-full items-center justify-center rounded-lg bg-linear-to-r from-action-600 to-[#06b6d4] text-base font-bold text-white shadow-[0_10px_24px_-10px_rgb(37_99_235/0.85)] transition-[filter,transform] hover:-translate-y-px hover:brightness-110"
    >
      Đăng nhập
    </a>
  );
}
