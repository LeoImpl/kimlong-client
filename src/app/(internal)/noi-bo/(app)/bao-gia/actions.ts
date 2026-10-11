"use server";

import { failure, success, type ActionResult } from "@/lib/internal/action-result";
import {
  changeQuotationStatus,
  cloneQuotation,
  createQuotation,
  exportDocument,
  lookupProducts,
  updateQuotation,
} from "@/lib/internal/api";
import { integerInput, quotationInput, textInput } from "@/lib/internal/inputs";
import type { ProductMatch, QuotationStatus, StoredDocument } from "@/lib/internal/types";

const STATUSES: readonly QuotationStatus[] = ["WAITING", "NEGOTIATING", "LOST"];

/** Creates a draft (`id` null) or saves the form over the version it was loaded with. */
export async function saveQuotationAction(
  id: string | null,
  raw: unknown,
): Promise<ActionResult<{ id: string; version: number }>> {
  try {
    const input = quotationInput(raw);
    if (!input.customerId) return { ok: false, message: "Hãy chọn khách hàng cho báo giá." };
    const quotationId = textInput(id, 36);
    const saved = quotationId
      ? await updateQuotation(quotationId, input)
      : await createQuotation(input);
    return success({ id: saved.id, version: saved.version });
  } catch (error) {
    return failure(error);
  }
}

/** Marks a quotation as sent, under negotiation or lost, or reopens a lost one. Winning has its own action. */
export async function changeQuotationStatusAction(
  id: unknown,
  version: unknown,
  status: unknown,
  reason?: unknown,
): Promise<ActionResult> {
  try {
    const quotationId = textInput(id, 36);
    const expected = integerInput(version);
    const target = STATUSES.find((candidate) => candidate === status);
    if (!quotationId || expected === null || !target) {
      return { ok: false, message: "Yêu cầu không hợp lệ." };
    }
    await changeQuotationStatus(quotationId, expected, target, textInput(reason, 500) ?? undefined);
    return success();
  } catch (error) {
    return failure(error);
  }
}

/** Copies a quotation into a new draft; answers the ID of the copy. */
export async function cloneQuotationAction(id: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const quotationId = textInput(id, 36);
    if (!quotationId) return { ok: false, message: "Yêu cầu không hợp lệ." };
    const copy = await cloneQuotation(quotationId);
    return success({ id: copy.id });
  } catch (error) {
    return failure(error);
  }
}

/** Catalogue names for part numbers typed or pasted into the grid. Unknown part numbers are simply absent. */
export async function lookupProductsAction(raw: unknown): Promise<ActionResult<ProductMatch[]>> {
  try {
    const partNumbers = (Array.isArray(raw) ? raw : [])
      .map((value) => textInput(value, 64))
      .filter((value): value is string => value !== null)
      .slice(0, 200);
    return success(await lookupProducts([...new Set(partNumbers)]));
  } catch (error) {
    return failure(error);
  }
}

/** Renders the stored quotation to PDF or Excel and keeps the file; the browser then downloads it by ID. */
export async function exportDocumentAction(
  id: unknown,
  format: unknown,
): Promise<ActionResult<StoredDocument>> {
  try {
    const quotationId = textInput(id, 36);
    if (!quotationId || (format !== "PDF" && format !== "XLSX")) {
      return { ok: false, message: "Yêu cầu không hợp lệ." };
    }
    return success(await exportDocument(quotationId, format));
  } catch (error) {
    return failure(error);
  }
}
