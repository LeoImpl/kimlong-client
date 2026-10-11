import { describe, expect, it } from "vitest";
import { customerInput, quotationInput } from "./inputs";

describe("customerInput", () => {
  it("keeps known fields, trims them and drops empty contact rows", () => {
    const input = customerInput({
      version: "3",
      companyName: "  Nhà máy ABC ",
      taxCode: "0301234567",
      industry: "   ",
      active: false,
      role: "ADMIN",
      contacts: [
        { name: " Trần Bình ", phone: "0912 345 678", email: "", isAdmin: true },
        { name: "", title: "", phone: "", email: "" },
      ],
    });
    expect(input).toEqual({
      version: 3,
      companyName: "Nhà máy ABC",
      taxCode: "0301234567",
      taxAddress: null,
      representative: null,
      industry: null,
      note: null,
      active: false,
      contacts: [{ name: "Trần Bình", title: null, phone: "0912 345 678", email: null }],
    });
  });

  it("survives input that is not an object at all", () => {
    expect(customerInput("x").companyName).toBe("");
    expect(customerInput(null).contacts).toEqual([]);
    expect(customerInput({ contacts: "many" }).contacts).toEqual([]);
  });
});

describe("quotationInput", () => {
  it("accepts only whole amounts, known VAT rates and ISO dates", () => {
    const input = quotationInput({
      customerId: "c-1",
      vatRate: "VAT_99",
      quoteDate: "11/10/2026",
      validUntil: "2026-11-10",
      lines: [
        {
          partNumber: "1613900100",
          quantity: "3",
          unitPrice: 1250000,
          unitCost: "800000",
          fixedCost: 1.5,
        },
        { partNumber: "", name: "  " },
        { name: "Công lắp đặt", quantity: "abc", unitPrice: "-" },
      ],
    });
    expect(input.vatRate).toBe("VAT_10");
    expect(input.quoteDate).toBeNull();
    expect(input.validUntil).toBe("2026-11-10");
    expect(input.lines).toEqual([
      {
        partNumber: "1613900100",
        name: null,
        unit: null,
        quantity: 3,
        unitPrice: 1250000,
        unitCost: 800000,
        fixedCost: null,
        leadTime: null,
        note: null,
      },
      {
        partNumber: null,
        name: "Công lắp đặt",
        unit: null,
        quantity: 1,
        unitPrice: 0,
        unitCost: null,
        fixedCost: null,
        leadTime: null,
        note: null,
      },
    ]);
  });
});
