import { cn } from "@/lib/cn";
import { hasFixedPrice, type Price as PriceValue } from "@/lib/api/types";

/** Vietnamese đồng, grouped with dots as the country writes them: 1.250.000 ₫. */
export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Almost every product in this catalogue is "liên hệ" — a fixed price is the exception, not the rule. Treating
 * "contact for price" as the normal, unapologetic case is why this component exists instead of an inline check.
 */
export function Price({ price, className }: { price: PriceValue | null; className?: string }) {
  if (hasFixedPrice(price) && price?.amount != null) {
    return (
      <span className={cn("font-bold text-ink", className)}>
        {formatPrice(price.amount, price.currency ?? "VND")}
      </span>
    );
  }
  // Bold brass: "ask us" is the answer on almost every card, so it reads as an invitation, not a gap.
  return <span className={cn("font-bold text-brand-700", className)}>Liên hệ</span>;
}
