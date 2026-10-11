import type {
  DeliveryStatus,
  PaymentMethod,
  PaymentStatus,
  QuotationStatus,
  VatRate,
} from "./types";

/**
 * How the internal area writes numbers, dates and statuses. Pure functions, usable on the server and in the
 * browser; amounts are whole dong.
 */

const NUMBER = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
const PERCENT = new Intl.NumberFormat("vi-VN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

/** "1.250.000" */
export function formatNumber(value: number): string {
  return NUMBER.format(value);
}

/** "1.250.000 ₫" */
export function formatVnd(value: number): string {
  return `${NUMBER.format(value)} ₫`;
}

/** "1,25 tỷ", "850 tr": for chart axes and stat tiles where the exact figure is shown elsewhere. */
export function formatCompactVnd(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${PERCENT.format(value / 1_000_000_000)} tỷ`;
  if (abs >= 1_000_000) return `${PERCENT.format(value / 1_000_000)} tr`;
  if (abs >= 1_000) return `${PERCENT.format(value / 1_000)} ng`;
  return NUMBER.format(value);
}

/** "29,5%" */
export function formatPercent(value: number): string {
  return `${PERCENT.format(value)}%`;
}

/**
 * "11/10/2026" from an ISO date (`2026-10-11`). Document dates are calendar dates, not instants, so they are
 * reformatted as text and never pass through a time zone.
 */
export function formatDay(isoDate: string | null | undefined): string {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : isoDate;
}

const DATE_TIME = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});

/** "10:32 11/10/2026" from an instant, in Vietnam's time zone whatever the server's. */
export function formatInstant(iso: string | null | undefined): string {
  return iso ? DATE_TIME.format(new Date(iso)) : "";
}

/** Today's calendar date in Vietnam as `yyyy-mm-dd`, for date inputs. */
export function todayIso(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(now);
}

export function formatFileSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${PERCENT.format(bytes / (1024 * 1024))} MB`
    : `${NUMBER.format(Math.max(1, Math.round(bytes / 1024)))} KB`;
}

type Tone = "neutral" | "brand" | "success" | "warning" | "danger";

export const quotationStatuses: Record<QuotationStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: "Nháp", tone: "neutral" },
  WAITING: { label: "Chờ phản hồi", tone: "warning" },
  NEGOTIATING: { label: "Đang thương lượng", tone: "brand" },
  WON: { label: "Đã chốt", tone: "success" },
  LOST: { label: "Không thành công", tone: "danger" },
};

export const deliveryStatuses: Record<DeliveryStatus, { label: string; tone: Tone }> = {
  NOT_DELIVERED: { label: "Chưa giao", tone: "neutral" },
  DELIVERING: { label: "Đang giao", tone: "warning" },
  DELIVERED: { label: "Đã giao", tone: "success" },
};

export const paymentStatuses: Record<PaymentStatus, { label: string; tone: Tone }> = {
  UNPAID: { label: "Chưa thanh toán", tone: "neutral" },
  PARTIALLY_PAID: { label: "Thanh toán một phần", tone: "warning" },
  PAID: { label: "Đã thanh toán", tone: "success" },
};

export const paymentMethods: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "Chuyển khoản",
  CASH: "Tiền mặt",
  OTHER: "Khác",
};

export const vatRates: Record<VatRate, { label: string; percent: number | null }> = {
  VAT_10: { label: "10%", percent: 10 },
  VAT_8: { label: "8%", percent: 8 },
  VAT_5: { label: "5%", percent: 5 },
  VAT_0: { label: "0%", percent: 0 },
  NOT_SUBJECT: { label: "Không chịu thuế", percent: null },
};

/** Status of a website request on the inquiry side. */
export const webRequestStatuses: Record<string, { label: string; tone: Tone }> = {
  NEW: { label: "Mới", tone: "warning" },
  IN_REVIEW: { label: "Đang xử lý", tone: "brand" },
  QUOTED: { label: "Đã báo giá", tone: "brand" },
  WON: { label: "Đã chốt", tone: "success" },
  LOST: { label: "Không thành công", tone: "danger" },
  CLOSED: { label: "Đã đóng", tone: "neutral" },
  CANCELLED: { label: "Đã hủy", tone: "neutral" },
};

/** "T3", "Q1" or "2026": the short name of a revenue period on charts and in tables. */
export function periodLabel(point: { period: string; year: number; index: number | null }): string {
  if (point.index === null) return String(point.year);
  return point.period.includes("Q") ? `Q${point.index}` : `T${point.index}`;
}
