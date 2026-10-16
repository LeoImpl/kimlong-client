"use server";

import { failure, success, type ActionResult } from "@/lib/internal/action-result";
import {
  createPaper,
  deletePaper,
  exportPaper,
  resetPaperTemplate,
  savePaperSettings,
  savePaperTemplate,
  updatePaper,
} from "@/lib/internal/api";
import {
  integerInput,
  paperInput,
  paperSectionsInput,
  paperSettingsInput,
  textInput,
} from "@/lib/internal/inputs";
import type { PaperFile, PaperKind } from "@/lib/internal/types";

const KINDS: readonly PaperKind[] = [
  "SALE_CONTRACT",
  "FRAMEWORK_CONTRACT",
  "ANNEX",
  "PAYMENT_REQUEST",
  "DELIVERY_NOTE",
];
const INVALID = { ok: false, message: "Yêu cầu không hợp lệ." } as const;

function kindInput(value: unknown): PaperKind | null {
  return KINDS.find((kind) => kind === value) ?? null;
}

/**
 * Starts a document from its standard text. A framework contract is made for a customer; the other kinds for an
 * order (an annex also names its framework contract). Answers the new document's ID.
 */
export async function createPaperAction(raw: {
  kind?: unknown;
  orderId?: unknown;
  customerId?: unknown;
  frameworkId?: unknown;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const kind = kindInput(raw?.kind);
    if (!kind) return INVALID;
    const paper = await createPaper({
      kind,
      orderId: textInput(raw.orderId, 36) ?? undefined,
      customerId: textInput(raw.customerId, 36) ?? undefined,
      frameworkId: textInput(raw.frameworkId, 36) ?? undefined,
    });
    return success({ id: paper.id });
  } catch (error) {
    return failure(error);
  }
}

/**
 * Makes a framework contract for the order's customer and puts the order under it as the first annex, in one step
 * for the salesperson. Answers the annex's ID.
 */
export async function createFrameworkWithAnnexAction(
  orderId: unknown,
  customerId: unknown,
): Promise<ActionResult<{ id: string; frameworkId: string }>> {
  try {
    const order = textInput(orderId, 36);
    const customer = textInput(customerId, 36);
    if (!order || !customer) return INVALID;
    const framework = await createPaper({ kind: "FRAMEWORK_CONTRACT", customerId: customer });
    const annex = await createPaper({ kind: "ANNEX", orderId: order, frameworkId: framework.id });
    return success({ id: annex.id, frameworkId: framework.id });
  } catch (error) {
    return failure(error);
  }
}

/** Saves the edited document over the version it was loaded with. */
export async function savePaperAction(id: unknown, raw: unknown): Promise<ActionResult> {
  try {
    const paperId = textInput(id, 36);
    const input = paperInput(raw);
    if (!paperId || !input) return INVALID;
    await updatePaper(paperId, input);
    return success();
  } catch (error) {
    return failure(error);
  }
}

export async function deletePaperAction(id: unknown, version: unknown): Promise<ActionResult> {
  try {
    const paperId = textInput(id, 36);
    const expected = integerInput(version);
    if (!paperId || expected === null) return INVALID;
    await deletePaper(paperId, expected);
    return success();
  } catch (error) {
    return failure(error);
  }
}

/** Renders the saved document as Word or PDF and keeps the file; answers it for the download. */
export async function exportPaperAction(
  id: unknown,
  format: unknown,
): Promise<ActionResult<PaperFile>> {
  try {
    const paperId = textInput(id, 36);
    if (!paperId || (format !== "PDF" && format !== "DOCX")) return INVALID;
    return success(await exportPaper(paperId, format));
  } catch (error) {
    return failure(error);
  }
}

/** Administrators only (the platform refuses others): changes the standard text of a kind. */
export async function savePaperTemplateAction(
  kind: unknown,
  version: unknown,
  sections: unknown,
): Promise<ActionResult> {
  try {
    const paperKind = kindInput(kind);
    const expected = integerInput(version);
    if (!paperKind || expected === null) return INVALID;
    await savePaperTemplate(paperKind, expected, paperSectionsInput(sections));
    return success();
  } catch (error) {
    return failure(error);
  }
}

export async function resetPaperTemplateAction(kind: unknown): Promise<ActionResult> {
  try {
    const paperKind = kindInput(kind);
    if (!paperKind) return INVALID;
    await resetPaperTemplate(paperKind);
    return success();
  } catch (error) {
    return failure(error);
  }
}

export async function savePaperSettingsAction(raw: unknown): Promise<ActionResult> {
  try {
    const settings = paperSettingsInput(raw);
    if (!settings) return INVALID;
    await savePaperSettings(settings);
    return success();
  } catch (error) {
    return failure(error);
  }
}
