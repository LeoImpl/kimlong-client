import { describe, expect, it } from "vitest";
import { emptyContact, toContactPayload, validateContact, validateMessage } from "./validation";

const valid = {
  ...emptyContact,
  name: "Trần Minh",
  email: "minh@nhamay.vn",
  phone: "0912345678",
};

describe("validateContact", () => {
  it("accepts the three required fields on their own", () => {
    expect(validateContact(valid)).toEqual({});
  });

  it("asks for what the API requires", () => {
    const errors = validateContact(emptyContact);
    expect(Object.keys(errors).sort()).toEqual(["email", "name", "phone"]);
  });

  it("applies the same phone and tax code rules as the platform", () => {
    expect(validateContact({ ...valid, phone: "12345" }).phone).toBeDefined();
    expect(validateContact({ ...valid, phone: "+84 981 577 876" }).phone).toBeUndefined();
    expect(validateContact({ ...valid, taxCode: "0312345678" }).taxCode).toBeUndefined();
    expect(validateContact({ ...valid, taxCode: "0312345678-001" }).taxCode).toBeUndefined();
    expect(validateContact({ ...valid, taxCode: "12345" }).taxCode).toBeDefined();
  });
});

describe("toContactPayload", () => {
  it("sends null for the optional fields rather than empty strings", () => {
    expect(toContactPayload({ ...valid, company: "  " })).toEqual({
      name: "Trần Minh",
      email: "minh@nhamay.vn",
      phone: "0912345678",
      company: null,
      taxCode: null,
      address: null,
    });
  });
});

describe("validateMessage", () => {
  it("is required for a consultation and optional for a quote", () => {
    expect(validateMessage("", true)).toBeDefined();
    expect(validateMessage("", false)).toBeUndefined();
  });
});
