import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * A product photo, or the placeholder. The placeholder is not hypothetical — `xy-lanh-tieu-chuan-crdng` has no
 * image at all — so it has to look deliberate rather than broken.
 *
 * The photo ignores pointer events and cannot be dragged, so right-click "Save image", drag-to-desktop and the iOS
 * long-press menu do not offer the file. This only slows casual copying: the real protection is the logo the API
 * burns into every product photo. Clicks still reach the enclosing link or button.
 */
export function ProductImage({
  src,
  alt,
  sizes,
  eager,
  className,
}: {
  src: string | null;
  alt: string;
  sizes: string;
  /** The image above the fold. Next 16 deprecated `priority`, and it never set `fetchpriority` anyway. */
  eager?: boolean;
  className?: string;
}) {
  if (!src) {
    return (
      <div className={cn("flex items-center justify-center bg-surface", className)} aria-hidden>
        <svg
          viewBox="0 0 48 48"
          className="size-10 text-line-strong"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="7" y="11" width="34" height="26" rx="3" />
          <path d="m11 31 8-8 6 6 5-5 7 7" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="18" cy="19" r="2.5" />
        </svg>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      draggable={false}
      className={cn(
        "pointer-events-none object-contain select-none [-webkit-touch-callout:none]",
        className,
      )}
    />
  );
}
