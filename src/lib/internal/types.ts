import type { components } from "@/types/admin-api";

/**
 * Types of the internal sales API, derived from the generated OpenAPI types (`npm run gen:api:admin`).
 *
 * springdoc marks every property optional; removing that while keeping `| null` gives the real shapes (see
 * `src/lib/api/types.ts` for the same approach on the public API). Nested objects are restated, because the
 * mapped type only reaches one level.
 */
type Concrete<T> = { [K in keyof T]-?: T[K] };
type Schemas = components["schemas"];

export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export type Staff = Concrete<Schemas["StaffView"]>;
export type StaffRef = Concrete<Schemas["StaffRefView"]>;

export type Contact = Concrete<Schemas["CustomerContactDto"]>;
export type Customer = Omit<Concrete<Schemas["CustomerView"]>, "contacts" | "assignee"> & {
  contacts: Contact[];
  assignee: StaffRef | null;
};
export type CustomerInput = Schemas["CustomerRequest"];
export type CustomerSummary = Concrete<Schemas["SalesCustomerSummaryView"]>;

export type CustomerSnapshot = Concrete<Schemas["CustomerSnapshotView"]>;
export type QuotationLine = Concrete<Schemas["SalesQuotationLineView"]>;
export type Quotation = Omit<
  Concrete<Schemas["SalesQuotationView"]>,
  "customer" | "createdBy" | "lines"
> & {
  customer: CustomerSnapshot;
  createdBy: StaffRef;
  lines: QuotationLine[];
};
export type QuotationStatus = Quotation["status"];
export type VatRate = Quotation["vatRate"];
export type QuotationSummary = Omit<Concrete<Schemas["SalesQuotationSummaryView"]>, "assignee"> & {
  assignee: StaffRef | null;
};
export type QuotationInput = Schemas["SalesQuotationRequest"];
export type QuotationLineInput = Schemas["SalesQuotationLineRequest"];
export type QuotedPrice = Concrete<Schemas["QuotedPriceView"]>;
export type ProductMatch = Concrete<Schemas["ProductMatchView"]>;
export type SalesSettings = Concrete<Schemas["SalesSettingsView"]>;

export type StoredDocument = Omit<Concrete<Schemas["DocumentView"]>, "createdBy"> & {
  createdBy: StaffRef;
};
export type DocumentFormat = StoredDocument["format"];
export type SellerStatus = Concrete<Schemas["SellerStatusView"]>;

export type OrderPayment = Omit<Concrete<Schemas["OrderPaymentView"]>, "recordedBy"> & {
  recordedBy: StaffRef;
};
export type SalesOrder = Omit<
  Concrete<Schemas["SalesOrderView"]>,
  "customer" | "createdBy" | "lines" | "payments"
> & {
  customer: CustomerSnapshot;
  createdBy: StaffRef;
  lines: QuotationLine[];
  payments: OrderPayment[];
};
export type DeliveryStatus = SalesOrder["deliveryStatus"];
export type PaymentStatus = SalesOrder["paymentStatus"];
export type PaymentMethod = OrderPayment["method"];
export type SalesOrderSummary = Omit<Concrete<Schemas["SalesOrderSummaryView"]>, "assignee"> & {
  assignee: StaffRef | null;
};

export type Overview = Concrete<Schemas["SalesOverviewView"]>;
export type RevenuePoint = Concrete<Schemas["SalesRevenuePointView"]>;
export type CustomerRevenue = Omit<Concrete<Schemas["SalesCustomerRevenueView"]>, "assignee"> & {
  assignee: StaffRef | null;
};

export type WebRequestQuotation = Concrete<Schemas["WebRequestQuotationView"]>;
export type WebRequestRow = Omit<
  Concrete<Schemas["WebRequestRowView"]>,
  "assignee" | "quotation"
> & {
  assignee: StaffRef | null;
  quotation: WebRequestQuotation | null;
};
export type WebRequestLine = Concrete<Schemas["WebRequestLineView"]>;
export type WebRequestDetail = Omit<
  Concrete<Schemas["WebRequestDetailView"]>,
  "assignee" | "quotation" | "lines"
> & {
  assignee: StaffRef | null;
  quotation: WebRequestQuotation | null;
  lines: WebRequestLine[];
};
export type WebRequestAccess = WebRequestRow["access"];
