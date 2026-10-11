import { Suspense } from "react";
import Link from "next/link";
import { InternalNav, InternalNavFallback } from "@/components/internal/InternalNav";
import { SessionKeepAlive } from "@/components/internal/SessionKeepAlive";
import { SignOutButton } from "@/components/internal/SignOutButton";
import { Skeleton } from "@/components/ui/Feedback";
import { getMe } from "@/lib/internal/api";
import { internalRoutes } from "@/lib/internal/routes";

/**
 * The frame of the working area: navigation on the left, the page on the right. The frame itself is static;
 * everything that reads the session streams in behind a Suspense boundary, as Cache Components requires for
 * request data: the user panel behind its own, every page behind `loading.tsx`, which (unlike a boundary written
 * here) also shows while navigating from one internal page to the next.
 */
export default function InternalAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="lg:flex lg:min-h-dvh">
      <aside className="bg-navy text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-60 lg:shrink-0 lg:flex-col">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:block lg:px-5 lg:py-5">
          <Link href={internalRoutes.dashboard} className="flex items-center gap-2.5">
            <span
              className="flex h-8 w-10 items-center justify-center rounded border border-brand-500 font-display text-[17px] font-semibold text-brand-300"
              aria-hidden
            >
              KL
            </span>
            <span className="leading-none">
              <span className="block font-display text-xl font-semibold text-white">Kim Long</span>
              <span className="mt-0.5 block text-xs text-white/60">Nội bộ kinh doanh</span>
            </span>
          </Link>
        </div>
        <div className="lg:flex-1 lg:overflow-y-auto">
          <Suspense fallback={<InternalNavFallback />}>
            <Navigation />
          </Suspense>
        </div>
        <div className="hidden border-t border-white/10 px-4 py-4 lg:block">
          <Suspense fallback={<Skeleton className="h-10 bg-white/10" />}>
            <UserPanel />
          </Suspense>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <main id="main" className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {children}
        </main>
        {/* On a phone the user panel sits under the page instead of in the sidebar. */}
        <div className="border-t border-line px-4 py-4 lg:hidden">
          <Suspense fallback={null}>
            <UserPanel light />
          </Suspense>
        </div>
      </div>
      <SessionKeepAlive />
    </div>
  );
}

async function Navigation() {
  return <InternalNav />;
}

async function UserPanel({ light = false }: { light?: boolean }) {
  // Also the access check for the frame: `getMe` goes through `requireStaff()` and the platform's admin zone.
  const me = await getMe();
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className={`truncate text-sm font-semibold ${light ? "text-ink" : "text-white"}`}>
          {me.name}
        </p>
        <p className={`text-xs ${light ? "text-muted" : "text-white/60"}`}>
          {me.admin ? "Quản trị viên" : "Nhân viên kinh doanh"}
        </p>
      </div>
      <SignOutButton
        label={light ? "Đăng xuất" : ""}
        className={
          light
            ? undefined
            : "h-9 border-white/20 bg-transparent px-2.5 text-white hover:border-white/50 hover:text-white"
        }
      />
    </div>
  );
}
