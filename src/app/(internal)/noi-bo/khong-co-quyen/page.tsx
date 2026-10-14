import type { Metadata } from "next";
import { Suspense } from "react";
import { ShieldAlert } from "lucide-react";
import { SignOutButton } from "@/components/internal/SignOutButton";
import { getSession } from "@/lib/internal/session";

export const metadata: Metadata = { title: "Không có quyền truy cập" };

/** Signed in at Keycloak, but not as staff: typically a customer account, since registration is open. */
export default function ForbiddenPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-line bg-page p-8 text-center">
        <ShieldAlert className="mx-auto size-10 text-warning" strokeWidth={1.5} aria-hidden />
        <h1 className="mt-4 text-2xl">Tài khoản không có quyền truy cập</h1>
        <p className="mt-2 text-sm text-body">
          Khu vực này chỉ dành cho nhân viên kinh doanh của Kim Long. Nếu bạn là nhân viên, hãy liên
          hệ quản trị viên để được cấp quyền, rồi đăng nhập lại.
        </p>
        <Suspense>
          <SignedInAs />
        </Suspense>
        <div className="mt-6 flex justify-center">
          <SignOutButton label="Đăng xuất và dùng tài khoản khác" />
        </div>
      </div>
    </main>
  );
}

async function SignedInAs() {
  const session = await getSession();
  if (!session) return null;
  return (
    <p className="mt-4 text-sm text-muted">
      Đang đăng nhập: <span className="font-medium text-ink">{session.user.username}</span>
    </p>
  );
}
