import { describe, expect, it } from "vitest";
import { canMakePaper } from "./paper-rules";

describe("which documents an order can get", () => {
  it.each([
    ["NOT_DELIVERED", ["SALE_CONTRACT", "ANNEX", "PAYMENT_REQUEST", "DELIVERY_NOTE"]],
    ["DELIVERING", ["SALE_CONTRACT", "ANNEX", "PAYMENT_REQUEST", "DELIVERY_NOTE"]],
    ["DELIVERED", ["PAYMENT_REQUEST", "DEBT_RECONCILIATION"]],
  ] as const)("%s", (status, allowed) => {
    const kinds = [
      "SALE_CONTRACT",
      "ANNEX",
      "PAYMENT_REQUEST",
      "DELIVERY_NOTE",
      "DEBT_RECONCILIATION",
    ] as const;
    expect(kinds.filter((kind) => canMakePaper(kind, status))).toEqual(allowed);
  });
});
