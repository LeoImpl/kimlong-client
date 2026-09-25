import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

/**
 * The company logo. `src` is the logo from the company profile (an image in the media module, stored in S3); the
 * header passes it once the profile has loaded. Without it — during the build, while the profile streams in, or if
 * the API is down — a text wordmark stands in: a tiny graphite-and-brass nameplate with the name beside it.
 *
 * The artwork is a gold wordmark about 7:1, so it is sized by height and keeps its own width.
 */
export function Logo({ src, className }: { src?: string | null; className?: string }) {
  if (src) {
    return (
      <Link
        href={routes.home}
        className={cn("flex shrink-0 items-center", className)}
        aria-label="Kim Long — trang chủ"
      >
        <Image
          src={src}
          alt="Kim Long"
          width={800}
          height={115}
          sizes="(min-width: 640px) 223px, 167px"
          loading="eager"
          className="h-6 w-auto sm:h-8"
        />
      </Link>
    );
  }
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
