"use server";

import { failure, success, type ActionResult } from "@/lib/internal/action-result";
import {
  cancelOrder,
  changeDelivery,
  recordPayment,
  reviseOrder,
  winQuotation,
} from "@/lib/internal/api";
import {
  integerInput,
  isoDateInput,
  percentInput,
  quotationLinesInput,
  textInput,
} from "@/lib/internal/inputs";
import type { DeliveryStatus, PaymentMethod } from "@/lib/internal/types";

const DELIVERY: readonly DeliveryStatus[] = ["NOT_DELIVERED", "DELIVERING", "DELIVERED"];
const METHODS: readonly PaymentMethod[] = ["BANK_TRANSFER", "CASH", "OTHER"];
const INVALID = { ok: false, message: "Yêu cầu không hợp lệ." } as const;

/** The "THẮNG" button: the quotation becomes won and its order is created, in one step on the platform. */
export async function winQuotationAction(
  quotationId: unknown,
  version: unknown,
  orderDate?: unknown,
  note?: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const id = textInput(quotationId, 36);
    const expected = integerInput(version);
    if (!id || expected === null) return INVALID;
    const order = await winQuotation(
      id,
      expected,
      isoDateInput(orderDate) ?? undefined,
      textInput(note) ?? undefined,
    );
    return success({ id: order.id });
  } catch (error) {
    return failure(error);
  }
}

/** Corrects the actual selling prices and quantities of an order that is not delivered yet. */
export async function reviseOrderAction(
  orderId: unknown,
  version: unknown,
  raw: {
    lines?: unknown;
    orderDate?: unknown;
    note?: unknown;
    commissionPercent?: unknown;
    shippingCost?: unknown;
  },
): Promise<ActionResult> {
  try {
    const id = textInput(orderId, 36);
    const expected = integerInput(version);
    if (!id || expected === null) return INVALID;
    await reviseOrder(
      id,
      expected,
      quotationLinesInput(raw?.lines),
      isoDateInput(raw?.orderDate) ?? undefined,
      textInput(raw?.note) ?? undefined,
      percentInput(raw?.commissionPercent),
      integerInput(raw?.shippingCost),
    );
    return success();
  } catch (error) {
    return failure(error);
  }
}

export async function changeDeliveryAction(
  orderId: unknown,
  version: unknown,
  status: unknown,
  deliveredOn?: unknown,
): Promise<ActionResult> {
  try {
    const id = textInput(orderId, 36);
    const expected = integerInput(version);
    const target = DELIVERY.find((candidate) => candidate === status);
    if (!id || expected === null || !target) return INVALID;
    await changeDelivery(id, expected, target, isoDateInput(deliveredOn) ?? undefined);
    return success();
  } catch (error) {
    return failure(error);
  }
}

export async function recordPaymentAction(
  orderId: unknown,
  version: unknown,
  raw: {
    amount?: unknown;
    paidOn?: unknown;
    method?: unknown;
    reference?: unknown;
    note?: unknown;
  },
): Promise<ActionResult> {
  try {
    const id = textInput(orderId, 36);
    const expected = integerInput(version);
    const amount = integerInput(raw?.amount);
    if (!id || expected === null) return INVALID;
    if (amount === null || amount <= 0) return { ok: false, message: "Nhập số tiền đã thu." };
    await recordPayment(id, expected, {
      amount,
      paidOn: isoDateInput(raw?.paidOn) ?? undefined,
      method: METHODS.find((candidate) => candidate === raw?.method) ?? "BANK_TRANSFER",
      reference: textInput(raw?.reference, 100) ?? undefined,
      note: textInput(raw?.note, 500) ?? undefined,
    });
    return success();
  } catch (error) {
    return failure(error);
  }
}

export async function cancelOrderAction(
  orderId: unknown,
  version: unknown,
  reason?: unknown,
): Promise<ActionResult> {
  try {
    const id = textInput(orderId, 36);
    const expected = integerInput(version);
    if (!id || expected === null) return INVALID;
    await cancelOrder(id, expected, textInput(reason, 500) ?? undefined);
    return success();
  } catch (error) {
    return failure(error);
  }
}
