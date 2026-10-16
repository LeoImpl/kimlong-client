import type { CustomerInput, QuotationInput, QuotationLineInput, VatRate } from "./types";

/**
 * Shapes what a form sent into a request body. A server action is a public POST endpoint: its argument is whatever
 * the caller put there, so only known fields of the expected types are passed on. Business validation stays with
 * the API, which answers with a code the form can show.
 */

function text(value: unknown, max = 2000): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function integer(value: unknown): number | null {
  const parsed =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isSafeInteger(parsed) ? parsed : null;
}

/** A percentage with up to two decimals; the API rejects what is out of range. */
function percent(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100
    ? Math.round(value * 100) / 100
    : null;
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function list(value: unknown, max: number): unknown[] {
  return Array.isArray(value) ? value.slice(0, max) : [];
}

export function customerInput(raw: unknown): CustomerInput {
  const source = record(raw);
  return {
    version: integer(source.version),
    companyName: text(source.companyName, 200) ?? "",
    taxCode: text(source.taxCode, 20),
    taxAddress: text(source.taxAddress, 300),
    representative: text(source.representative, 100),
    industry: text(source.industry, 100),
    note: text(source.note),
    active: source.active !== false,
    contacts: list(source.contacts, 20)
      .map(record)
      .map((contact) => ({
        name: text(contact.name, 100) ?? "",
        title: text(contact.title, 100),
        phone: text(contact.phone, 30),
        email: text(contact.email, 254),
      }))
      // A row the salesperson added and left empty is not a contact.
      .filter((contact) => contact.name || contact.phone || contact.email),
  };
}

const VAT_RATES: readonly VatRate[] = ["VAT_10", "VAT_8", "VAT_5", "VAT_0", "NOT_SUBJECT"];

function isoDate(value: unknown): string | null {
  const candidate = text(value, 10);
  return candidate && /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : null;
}

export function quotationLineInput(raw: unknown): QuotationLineInput {
  const line = record(raw);
  return {
    partNumber: text(line.partNumber, 64),
    name: text(line.name, 500),
    unit: text(line.unit, 20),
    quantity: integer(line.quantity) ?? 1,
    unitPrice: integer(line.unitPrice) ?? 0,
    unitCost: integer(line.unitCost),
    fixedCost: integer(line.fixedCost),
    leadTime: text(line.leadTime, 100),
    note: text(line.note, 500),
  };
}

export function quotationLinesInput(raw: unknown): QuotationLineInput[] {
  return (
    list(raw, 200)
      .map(quotationLineInput)
      // Trailing blank rows of the grid are not lines.
      .filter((line) => line.partNumber || line.name)
  );
}

export function quotationInput(raw: unknown): QuotationInput {
  const source = record(raw);
  const vatRate = VAT_RATES.find((rate) => rate === source.vatRate) ?? "VAT_10";
  return {
    version: integer(source.version),
    customerId: text(source.customerId, 36) ?? "",
    contactName: text(source.contactName, 100),
    contactPhone: text(source.contactPhone, 30),
    contactEmail: text(source.contactEmail, 254),
    quoteDate: isoDate(source.quoteDate),
    validUntil: isoDate(source.validUntil),
    vatRate,
    commissionPercent: percent(source.commissionPercent),
    shippingCost: integer(source.shippingCost),
    paymentTerms: text(source.paymentTerms, 1000),
    deliveryTerms: text(source.deliveryTerms, 1000),
    warrantyTerms: text(source.warrantyTerms, 1000),
    note: text(source.note),
    lines: quotationLinesInput(source.lines),
  };
}

export {
  integer as integerInput,
  isoDate as isoDateInput,
  percent as percentInput,
  text as textInput,
};
