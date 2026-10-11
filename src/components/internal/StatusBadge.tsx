import { Badge } from "@/components/ui/Badge";
import {
  deliveryStatuses,
  paymentStatuses,
  quotationStatuses,
  webRequestStatuses,
} from "@/lib/internal/format";
import type { DeliveryStatus, PaymentStatus, QuotationStatus } from "@/lib/internal/types";

export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  const { label, tone } = quotationStatuses[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  const { label, tone } = deliveryStatuses[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, tone } = paymentStatuses[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function WebRequestStatusBadge({ status }: { status: string }) {
  const known = webRequestStatuses[status];
  return <Badge tone={known?.tone ?? "neutral"}>{known?.label ?? status}</Badge>;
}
