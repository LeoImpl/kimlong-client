import { apiFetch } from "./client";
import { env } from "@/lib/env";
import type { QuoteLine, SubmitQuoteRequest, Submitted } from "./types";

/**
 * The only call this app makes from the browser, and the only reason the API needs a CORS entry for this origin.
 * It runs client-side so a submission that fails can be retried in place, with the typed values still on screen,
 * instead of bouncing through a server round trip that would lose them.
 */
export async function submitQuoteRequest(request: SubmitQuoteRequest): Promise<Submitted> {
  return apiFetch<Submitted>("/api/public/v1/quote-requests", {
    method: "POST",
    baseUrl: env.publicApiBaseUrl,
    body: request,
  });
}

export function quoteLine(line: {
  productSlug: string;
  partNumber: string | null;
  quantity: number;
  unit: string;
}): QuoteLine {
  return {
    productSlug: line.productSlug,
    partNumber: line.partNumber,
    description: null,
    quantity: line.quantity,
    unit: line.unit || null,
  };
}
