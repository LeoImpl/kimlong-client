import { cn } from "@/lib/cn";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger";

/**
 * A short fact next to a product: "Chính hãng", "12 mã", "Giao toàn quốc". Tones carry meaning — green is
 * available/genuine, amber is pending — so a badge is never coloured for decoration.
 */

const tones: Record<Tone, string> = {
  neutral: "bg-page text-body border-line",
  brand: "bg-brand-50 text-brand-800 border-brand-200",
  success: "bg-success-soft text-success border-success/20",
  warning: "bg-warning-soft text-warning border-warning/20",
  danger: "bg-danger-soft text-danger border-danger/20",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium [&_svg]:size-3.5 [&_svg]:shrink-0",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
