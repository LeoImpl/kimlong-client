import { cacheLife, cacheTag } from "next/cache";
import { apiFetch } from "./client";
import type { CompanyProfile, Hotline, PartnerBrand } from "./types";

export { formatPhone, telHref, zaloHref } from "@/lib/phone";

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
