import Link from "next/link";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

/**
 * Wordmark rather than an image: there is no logo file yet, and a text mark stays sharp at every size, needs no
 * request, and can be swapped for the real artwork without touching the layout. The mark is a tiny nameplate —
 * graphite with a brass edge and rivets — the same device the site uses wherever a part number is the subject.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href={routes.home}
      className={cn("flex shrink-0 items-center gap-2.5", className)}
      aria-label="Kim Long — trang chủ"
    >
      <span
        className="plate plate-dark flex h-8 w-11 items-center justify-center border-brand-500 font-display text-[15px] font-semibold text-brand-300 [--rivet-inset:4px]"
        aria-hidden
      >
        KL
      </span>
      <span className="leading-none">
        <span className="block font-display text-[22px] font-semibold text-ink">Kim Long</span>
        <span className="mt-0.5 hidden text-xs text-muted sm:block">Thiết bị công nghiệp</span>
      </span>
    </Link>
  );
}
