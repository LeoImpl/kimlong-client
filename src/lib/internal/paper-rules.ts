import type { DeliveryStatus, PaperKind } from "@/lib/internal/types";

/**
 * Whether a new document of this kind can be made for an order in this delivery state; mirrors
 * `TradeDocumentKind.madeFor` on the platform. Before delivery: the contract (or annex), payment requests and delivery
 * notes. After it: payment requests and the debt reconciliation. Documents made earlier stay either way.
 */
/** A sales contract in Vietnamese or in both languages; an order has at most one. */
export function isSaleContract(kind: PaperKind): boolean {
  return kind === "SALE_CONTRACT" || kind === "SALE_CONTRACT_BILINGUAL";
}

export function canMakePaper(kind: PaperKind, delivery: DeliveryStatus): boolean {
  const delivered = delivery === "DELIVERED";
  switch (kind) {
    case "SALE_CONTRACT":
    case "SALE_CONTRACT_BILINGUAL":
    case "ANNEX":
    case "DELIVERY_NOTE":
      return !delivered;
    case "DEBT_RECONCILIATION":
      return delivered;
    case "PAYMENT_REQUEST":
    case "FRAMEWORK_CONTRACT":
      return true;
  }
}
