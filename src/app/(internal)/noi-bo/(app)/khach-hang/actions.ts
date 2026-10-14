"use server";

import { failure, success, type ActionResult } from "@/lib/internal/action-result";
import {
  createCustomer,
  reassignCustomer,
  searchCustomers,
  updateCustomer,
} from "@/lib/internal/api";
import { customerInput, integerInput, textInput } from "@/lib/internal/inputs";
import type { Customer } from "@/lib/internal/types";

/** Creates the customer (`id` null) or saves the form over the version it was loaded with. */
export async function saveCustomerAction(
  id: string | null,
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const input = customerInput(raw);
    const customerId = textInput(id, 36);
    const saved = customerId
      ? await updateCustomer(customerId, input)
      : await createCustomer(input);
    return success({ id: saved.id });
  } catch (error) {
    return failure(error);
  }
}

/** Administrators only; the platform refuses anyone else. */
export async function reassignCustomerAction(
  id: unknown,
  version: unknown,
  assigneeUserId: unknown,
): Promise<ActionResult> {
  try {
    const customerId = textInput(id, 36);
    const expected = integerInput(version);
    if (!customerId || expected === null) {
      return { ok: false, message: "Yêu cầu không hợp lệ." };
    }
    await reassignCustomer(customerId, expected, textInput(assigneeUserId, 100));
    return success();
  } catch (error) {
    return failure(error);
  }
}

/** Type-ahead for the customer picker on the quotation form: the caller's own customers only. */
export async function findCustomersAction(query: unknown): Promise<ActionResult<Customer[]>> {
  try {
    const page = await searchCustomers({ q: textInput(query, 100) ?? undefined, size: 20 });
    return success(page.items);
  } catch (error) {
    return failure(error);
  }
}
