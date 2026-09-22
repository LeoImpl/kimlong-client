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
      className={cn("flex shrink-0 items-center gap-2.5", className)}
      aria-label="Kim Long — trang chủ"
    >
      <span
        className="flex size-9 items-center justify-center rounded-md bg-navy font-mono text-sm font-semibold text-white"
        aria-hidden
      >
        KL
      </span>
      <span className="hidden leading-tight sm:block">
        <span className="block text-[15px] font-bold tracking-tight text-ink">KIM LONG</span>
        <span className="block text-[11px] font-medium tracking-wide text-muted uppercase">
          Thiết bị công nghiệp
        </span>
      </span>
    </Link>
  );
}
