import { cacheLife, cacheTag } from "next/cache";
import { apiFetch } from "./client";
import type { CompanyProfile, Hotline, PartnerBrand } from "./types";

/**
 * Company profile and partner brands. Both are on every page (footer, mobile contact bar) and change perhaps
 * twice a year, so they are cached hard and tagged for eviction once an admin UI exists.
 */

const TAGS = { profile: "company:profile", partners: "company:partners" } as const;

export async function getCompany(): Promise<CompanyProfile> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.profile);
  return apiFetch<CompanyProfile>("/api/public/v1/company");
}

export async function getPartners(): Promise<PartnerBrand[]> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.partners);
  return apiFetch<PartnerBrand[]>("/api/public/v1/company/partners");
}

/** The number to call. Sales first, because that is who a buyer wants; anything else is better than nothing. */
export function primaryHotline(company: CompanyProfile): Hotline | null {
  return company.hotlines.find((h) => h.type === "SALES") ?? company.hotlines[0] ?? null;
}

/**
 * Vietnamese mobile numbers are written 0981 577 876 but must be dialled without the spaces, and Zalo's
 * `zalo.me/<number>` wants the bare digits too.
 */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function zaloHref(phone: string): string {
  return `https://zalo.me/${phone.replace(/\D/g, "")}`;
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10
    ? `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
    : phone;
}
