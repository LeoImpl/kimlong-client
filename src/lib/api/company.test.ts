import { describe, expect, it } from "vitest";
import { primaryHotline } from "./company";
import { formatPhone, telHref, zaloHref } from "@/lib/phone";
import type { CompanyProfile, Hotline } from "./types";

const hotline = (type: Hotline["type"], phone: string): Hotline => ({ type, phone, label: null });

function company(hotlines: Hotline[]): CompanyProfile {
  return {
    legalName: "Công ty TNHH Kim Long",
    shortName: "Kim Long",
    tagline: null,
    foundedYear: null,
    headquarters: null,
    taxCode: null,
    email: "sales@kimlong.vn",
    hotlines,
    domains: [],
    aboutSections: [],
    highlights: [],
    milestones: [],
    technicalDocuments: [],
  };
}

describe("hotlines", () => {
  it("prefers the sales number, because that is who a buyer wants", () => {
    const profile = company([hotline("SUPPORT", "0900000000"), hotline("SALES", "0981577876")]);
    expect(primaryHotline(profile)?.phone).toBe("0981577876");
  });

  it("falls back to any number rather than showing none", () => {
    expect(primaryHotline(company([hotline("SUPPORT", "0900000000")]))?.phone).toBe("0900000000");
    expect(primaryHotline(company([]))).toBeNull();
  });

  it("groups a Vietnamese mobile number for reading but dials it unformatted", () => {
    expect(formatPhone("0981577876")).toBe("0981 577 876");
    expect(telHref("0981 577 876")).toBe("tel:0981577876");
    expect(zaloHref("0981 577 876")).toBe("https://zalo.me/0981577876");
  });

  it("leaves a number it does not recognise alone instead of mangling it", () => {
    expect(formatPhone("+84 28 3999 1234")).toBe("+84 28 3999 1234");
  });
});
