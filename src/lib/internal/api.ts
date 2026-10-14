import "server-only";
import { cache } from "react";
import { SALES_API, staffFetch, staffFetchOrNull } from "./staff-fetch";
import type {
  Customer,
  CustomerInput,
  CustomerRevenue,
  CustomerSummary,
  DeliveryStatus,
  DocumentFormat,
  Overview,
  Page,
  PaymentMethod,
  PaymentStatus,
  ProductMatch,
  Quotation,
  QuotationInput,
  QuotationLineInput,
  QuotationStatus,
  QuotationSummary,
  QuotedPrice,
  RevenuePoint,
  SalesOrder,
  SalesOrderSummary,
  SalesSettings,
  SellerStatus,
  Staff,
  StoredDocument,
  WebRequestDetail,
  WebRequestRow,
} from "./types";

/**
 * The internal sales API, one function per endpoint. Server only: each call goes through `staffFetch`, which
 * checks the session and attaches the salesperson's token. Reads that several components of one page need are
 * wrapped in React's `cache`, so they hit the API once per request.
 */

// --- Session ---------------------------------------------------------------------------------------------------

/**
 * The signed-in person as the platform sees them. Calling it also records them in the staff directory, which is
 * what makes them selectable as "nhân viên phụ trách".
 */
export const getMe = cache((): Promise<Staff> => staffFetch<Staff>(`${SALES_API}/me`));

export const listStaff = cache((): Promise<Staff[]> => staffFetch<Staff[]>(`${SALES_API}/staff`));

export const getSettings = cache((): Promise<SalesSettings> =>
  staffFetch<SalesSettings>(`${SALES_API}/settings`),
);

// --- Customers -------------------------------------------------------------------------------------------------

export interface CustomerQuery {
  q?: string;
  staffId?: string;
  unassigned?: boolean;
  includeInactive?: boolean;
  page?: number;
  size?: number;
}

export function searchCustomers(query: CustomerQuery = {}): Promise<Page<Customer>> {
  return staffFetch<Page<Customer>>(`${SALES_API}/customers`, { query: { ...query } });
}

export const getCustomer = cache((id: string): Promise<Customer | null> =>
  staffFetchOrNull<Customer>(`${SALES_API}/customers/${encodeURIComponent(id)}`),
);

export function getCustomerSummary(id: string): Promise<CustomerSummary> {
  return staffFetch<CustomerSummary>(`${SALES_API}/customers/${encodeURIComponent(id)}/summary`);
}

export function createCustomer(input: CustomerInput): Promise<Customer> {
  return staffFetch<Customer>(`${SALES_API}/customers`, { body: input });
}

export function updateCustomer(id: string, input: CustomerInput): Promise<Customer> {
  return staffFetch<Customer>(`${SALES_API}/customers/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: input,
  });
}

export function reassignCustomer(
  id: string,
  version: number,
  assigneeUserId: string | null,
): Promise<Customer> {
  return staffFetch<Customer>(`${SALES_API}/customers/${encodeURIComponent(id)}/assignee`, {
    method: "PUT",
    body: { version, assigneeUserId },
  });
}

// --- Quotations ------------------------------------------------------------------------------------------------

export interface QuotationQuery {
  q?: string;
  status?: QuotationStatus;
  customerId?: string;
  from?: string;
  to?: string;
  staffId?: string;
  page?: number;
  size?: number;
}

export function searchQuotations(query: QuotationQuery = {}): Promise<Page<QuotationSummary>> {
  return staffFetch<Page<QuotationSummary>>(`${SALES_API}/quotations`, { query: { ...query } });
}

export const getQuotation = cache((id: string): Promise<Quotation | null> =>
  staffFetchOrNull<Quotation>(`${SALES_API}/quotations/${encodeURIComponent(id)}`),
);

export function createQuotation(input: QuotationInput): Promise<Quotation> {
  return staffFetch<Quotation>(`${SALES_API}/quotations`, { body: input });
}

export function updateQuotation(id: string, input: QuotationInput): Promise<Quotation> {
  return staffFetch<Quotation>(`${SALES_API}/quotations/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: input,
  });
}

export function changeQuotationStatus(
  id: string,
  version: number,
  status: QuotationStatus,
  reason?: string,
): Promise<Quotation> {
  return staffFetch<Quotation>(`${SALES_API}/quotations/${encodeURIComponent(id)}/status`, {
    body: { version, status, reason: reason ?? null },
  });
}

export function cloneQuotation(id: string, customerId?: string): Promise<Quotation> {
  return staffFetch<Quotation>(`${SALES_API}/quotations/${encodeURIComponent(id)}/clone`, {
    body: { customerId: customerId ?? null },
  });
}

export function findQuotedPrices(partNumber: string, customerId?: string): Promise<QuotedPrice[]> {
  return staffFetch<QuotedPrice[]>(`${SALES_API}/quoted-prices`, {
    query: { partNumber, customerId },
  });
}

/** Catalogue products for part numbers typed into a quotation; unknown part numbers are left out. */
export function lookupProducts(partNumbers: string[]): Promise<ProductMatch[]> {
  if (partNumbers.length === 0) return Promise.resolve([]);
  // Repeated `partNumber` parameters, which the shared query builder (one value per key) cannot express.
  const search = partNumbers.map((value) => `partNumber=${encodeURIComponent(value)}`).join("&");
  return staffFetch<ProductMatch[]>(`${SALES_API}/products/lookup?${search}`);
}

// --- Quotation files -------------------------------------------------------------------------------------------

export function listDocuments(quotationId: string): Promise<StoredDocument[]> {
  return staffFetch<StoredDocument[]>(
    `${SALES_API}/quotations/${encodeURIComponent(quotationId)}/documents`,
  );
}

export function exportDocument(
  quotationId: string,
  format: DocumentFormat,
): Promise<StoredDocument> {
  return staffFetch<StoredDocument>(
    `${SALES_API}/quotations/${encodeURIComponent(quotationId)}/documents`,
    { method: "POST", query: { format: format.toLowerCase() } },
  );
}

export const getSellerStatus = cache((): Promise<SellerStatus> =>
  staffFetch<SellerStatus>(`${SALES_API}/seller`),
);

// --- Orders ----------------------------------------------------------------------------------------------------

export interface OrderQuery {
  q?: string;
  delivery?: DeliveryStatus;
  payment?: PaymentStatus;
  includeCancelled?: boolean;
  customerId?: string;
  from?: string;
  to?: string;
  staffId?: string;
  page?: number;
  size?: number;
}

export function searchOrders(query: OrderQuery = {}): Promise<Page<SalesOrderSummary>> {
  return staffFetch<Page<SalesOrderSummary>>(`${SALES_API}/orders`, { query: { ...query } });
}

export const getOrder = cache((id: string): Promise<SalesOrder | null> =>
  staffFetchOrNull<SalesOrder>(`${SALES_API}/orders/${encodeURIComponent(id)}`),
);

export function winQuotation(
  quotationId: string,
  version: number,
  orderDate?: string,
  note?: string,
): Promise<SalesOrder> {
  return staffFetch<SalesOrder>(`${SALES_API}/quotations/${encodeURIComponent(quotationId)}/win`, {
    body: { version, orderDate: orderDate || null, note: note || null },
  });
}

export function reviseOrder(
  id: string,
  version: number,
  lines: QuotationLineInput[],
  orderDate?: string,
  note?: string,
): Promise<SalesOrder> {
  return staffFetch<SalesOrder>(`${SALES_API}/orders/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: { version, lines, orderDate: orderDate || null, note: note || null },
  });
}

export function changeDelivery(
  id: string,
  version: number,
  status: DeliveryStatus,
  deliveredOn?: string,
): Promise<SalesOrder> {
  return staffFetch<SalesOrder>(`${SALES_API}/orders/${encodeURIComponent(id)}/delivery`, {
    body: { version, status, deliveredOn: deliveredOn || null },
  });
}

export interface PaymentInput {
  amount: number;
  paidOn?: string;
  method: PaymentMethod;
  reference?: string;
  note?: string;
}

export function recordPayment(
  id: string,
  version: number,
  payment: PaymentInput,
): Promise<SalesOrder> {
  return staffFetch<SalesOrder>(`${SALES_API}/orders/${encodeURIComponent(id)}/payments`, {
    body: {
      version,
      amount: payment.amount,
      paidOn: payment.paidOn || null,
      method: payment.method,
      reference: payment.reference || null,
      note: payment.note || null,
    },
  });
}

export function cancelOrder(id: string, version: number, reason?: string): Promise<SalesOrder> {
  return staffFetch<SalesOrder>(`${SALES_API}/orders/${encodeURIComponent(id)}/cancel`, {
    body: { version, reason: reason || null },
  });
}

// --- Reports ---------------------------------------------------------------------------------------------------

export interface ReportQuery {
  year?: number;
  staffId?: string;
}

export function getOverview(query: ReportQuery = {}): Promise<Overview> {
  return staffFetch<Overview>(`${SALES_API}/reports/overview`, { query: { ...query } });
}

export function getRevenue(
  by: "month" | "quarter" | "year",
  query: ReportQuery = {},
): Promise<RevenuePoint[]> {
  return staffFetch<RevenuePoint[]>(`${SALES_API}/reports/revenue`, { query: { by, ...query } });
}

export function getCustomerRevenue(query: ReportQuery = {}): Promise<CustomerRevenue[]> {
  return staffFetch<CustomerRevenue[]>(`${SALES_API}/reports/customers`, { query: { ...query } });
}

// --- Website requests ------------------------------------------------------------------------------------------

export function listWebRequests(
  query: { open?: boolean; page?: number; size?: number } = {},
): Promise<Page<WebRequestRow>> {
  return staffFetch<Page<WebRequestRow>>(`${SALES_API}/web-requests`, { query: { ...query } });
}

export const getWebRequest = cache((id: string): Promise<WebRequestDetail | null> =>
  staffFetchOrNull<WebRequestDetail>(`${SALES_API}/web-requests/${encodeURIComponent(id)}`),
);

export async function countPendingWebRequests(): Promise<number> {
  const result = await staffFetch<{ pending: number }>(`${SALES_API}/web-requests/pending`);
  return result.pending;
}

export function claimWebRequest(id: string): Promise<WebRequestDetail> {
  return staffFetch<WebRequestDetail>(`${SALES_API}/web-requests/${encodeURIComponent(id)}/claim`, {
    method: "POST",
  });
}

export function createQuotationFromWebRequest(id: string, customerId?: string): Promise<Quotation> {
  return staffFetch<Quotation>(`${SALES_API}/web-requests/${encodeURIComponent(id)}/quotation`, {
    body: { customerId: customerId ?? null },
  });
}
