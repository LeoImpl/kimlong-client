import Link from "next/link";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

/**
 * Wordmark rather than an image: there is no logo file yet, and a text mark stays sharp at every size, needs no
 * request, and can be swapped for the real artwork without touching the layout.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href={routes.home}
      className={cn("flex items-center gap-2.5", className)}
      aria-label="Kim Long — trang chủ"
    >
      <span
        className="flex size-9 items-center justify-center rounded bg-brand-700 text-sm font-bold text-white"
        aria-hidden
      >
        KL
      </span>
      <span className="leading-tight">
        <span className="block text-base font-bold tracking-tight text-ink">KIM LONG</span>
        <span className="block text-[11px] text-muted">Thiết bị công nghiệp</span>
      </span>
    </Link>
  );
}
