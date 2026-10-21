import type {
  CustomerInput,
  PaperInput,
  PaperParty,
  PaperSection,
  PaperSettings,
  QuotationInput,
  QuotationLineInput,
  VatRate,
} from "./types";

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
    representativeTitle: text(source.representativeTitle, 100),
    representativeSalutation: text(source.representativeSalutation, 10),
    shortCode: text(source.shortCode, 15),
    phone: text(source.phone, 60),
    bankAccount: text(source.bankAccount, 300),
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

function party(raw: unknown): PaperParty {
  const source = record(raw);
  return {
    name: text(source.name, 200) ?? "",
    address: text(source.address, 300),
    taxCode: text(source.taxCode, 20),
    phone: text(source.phone, 60),
    email: text(source.email, 254),
    bankAccount: text(source.bankAccount, 300),
    representative: text(source.representative, 100),
    representativeTitle: text(source.representativeTitle, 100),
    salutation: text(source.salutation, 10),
    nameEn: text(source.nameEn, 200),
    addressEn: text(source.addressEn, 300),
    representativeTitleEn: text(source.representativeTitleEn, 100),
  };
}

/** Section bodies keep their line breaks: each line is a paragraph of the printed document. */
export function paperSectionsInput(raw: unknown): PaperSection[] {
  return list(raw, 40)
    .map(record)
    .map((section) => ({
      heading: text(section.heading, 200),
      body: typeof section.body === "string" ? section.body.slice(0, 20000) : "",
    }))
    .filter((section) => section.heading || section.body.trim());
}

/** The edited document; `null` when the version or the number is missing. */
export function paperInput(raw: unknown): PaperInput | null {
  const source = record(raw);
  const version = integer(source.version);
  const number = text(source.number, 60);
  if (version === null || !number) return null;
  const delivery =
    source.delivery === null || source.delivery === undefined ? null : record(source.delivery);
  return {
    version,
    number,
    issuedOn: isoDate(source.issuedOn),
    buyer: party(source.buyer),
    seller: party(source.seller),
    validUntil: isoDate(source.validUntil),
    creditLimit: integer(source.creditLimit),
    paymentDays: integer(source.paymentDays),
    amount: integer(source.amount),
    purpose: text(source.purpose, 300),
    sections: paperSectionsInput(source.sections),
    installments: list(source.installments, 10)
      .map(record)
      .map((installment) => ({
        percent: integer(installment.percent) ?? 0,
        condition: text(installment.condition, 500) ?? "",
        conditionEn: text(installment.conditionEn, 500),
      })),
    delivery: delivery && {
      deliveredBy: text(delivery.deliveredBy, 200),
      receiverName: text(delivery.receiverName, 200),
      receiverTitle: text(delivery.receiverTitle, 200),
      contact: text(delivery.contact, 200),
      address: text(delivery.address, 300),
      lines: list(delivery.lines, 200)
        .map(record)
        .map((line) => ({
          partNumber: text(line.partNumber, 64),
          name: text(line.name, 500),
          unit: text(line.unit, 20),
          ordered: integer(line.ordered) ?? 0,
          delivered: integer(line.delivered) ?? 0,
          note: text(line.note, 500),
        })),
    },
  };
}

export function paperSettingsInput(raw: unknown): PaperSettings | null {
  const source = record(raw);
  const version = integer(source.version);
  if (version === null) return null;
  return {
    version,
    signatoryName: text(source.signatoryName, 100) ?? "",
    signatoryTitle: text(source.signatoryTitle, 100) ?? "",
    signatorySalutation: text(source.signatorySalutation, 10),
    city: text(source.city, 100) ?? "",
    companyNameEn: text(source.companyNameEn, 200),
    companyAddressEn: text(source.companyAddressEn, 300),
    signatoryTitleEn: text(source.signatoryTitleEn, 100),
    cityEn: text(source.cityEn, 100),
  };
}

export {
  integer as integerInput,
  isoDate as isoDateInput,
  percent as percentInput,
  text as textInput,
};
