"use server";

import { failure, success, type ActionResult } from "@/lib/internal/action-result";
import { claimWebRequest, createQuotationFromWebRequest } from "@/lib/internal/api";
import { textInput } from "@/lib/internal/inputs";

/** The caller takes a website request nobody has taken yet. */
export async function claimWebRequestAction(id: unknown): Promise<ActionResult> {
  try {
    const requestId = textInput(id, 36);
    if (!requestId) return { ok: false, message: "Yêu cầu không hợp lệ." };
    await claimWebRequest(requestId);
    return success();
  } catch (error) {
    return failure(error);
  }
}

/**
 * Writes the draft quotation for a request the caller has taken, with the requested lines. Without `customerId`
 * the platform uses the caller's customer with the request's tax code.
 */
export async function createQuotationFromWebRequestAction(
  id: unknown,
  customerId?: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const requestId = textInput(id, 36);
    if (!requestId) return { ok: false, message: "Yêu cầu không hợp lệ." };
    const quotation = await createQuotationFromWebRequest(
      requestId,
      textInput(customerId, 36) ?? undefined,
    );
    return success({ id: quotation.id });
  } catch (error) {
    return failure(error);
  }
}
