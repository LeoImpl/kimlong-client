import { describe, expect, it } from "vitest";
import { formatPrice } from "./Price";

describe("formatPrice", () => {
  it("writes đồng the way Vietnam writes it, without decimals", () => {
    // Intl uses a narrow no-break space before the symbol; normalised so the assertion is about the digits.
    expect(formatPrice(1250000, "VND").replace(/\s/g, " ")).toBe("1.250.000 ₫");
  });
});
