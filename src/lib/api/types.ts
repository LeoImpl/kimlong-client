import type { components } from "@/types/api";

/**
 * Domain types for the public API.
 *
 * `src/types/api.ts` is generated from the platform's OpenAPI document and is the source of truth for shape, but
 * springdoc marks every property optional, which would force a guard on each field access. springdoc does however
 * distinguish genuinely nullable values by emitting `| null`, so removing optionality while keeping `| null` gives
 * exactly the right types: `slug: string`, `summary: string | null`.
 *
 * Because these are derived rather than hand-written, a change to the API breaks the build here instead of
 * surfacing as `undefined` in production.
 */
type Concrete<T> = { [K in keyof T]-?: T[K] };

type Schemas = components["schemas"];

export type CategoryNode = Omit<Concrete<Schemas["CategoryNodeResponse"]>, "children"> & {
  children: CategoryNode[];
};

export type Brand = Concrete<Schemas["PublicBrandResponse"]>;
export type Price = Concrete<Schemas["PriceResponse"]>;
export type Ref = Concrete<Schemas["RefResponse"]>;
export type Spec = Concrete<Schemas["SpecResponse"]>;
export type Variant = Concrete<Schemas["VariantResponse"]>;
export type Commercial = Concrete<Schemas["CommercialResponse"]>;
export type MediaFile = Concrete<Schemas["MediaResponse"]>;
export type ProductSummary = Concrete<Schemas["PublicProductSummaryResponse"]>;
export type ProductDetail = Concrete<Schemas["PublicProductDetailResponse"]>;

export type Page<T> = {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

/** Quote request submission. `website` is the honeypot and must always be sent empty. */
export type SubmitQuoteRequest = Concrete<Schemas["SubmitQuoteRequestDto"]>;
export type Submitted = Concrete<Schemas["SubmittedResponse"]>;
export type Contact = Concrete<Schemas["ContactDto"]>;

/**
 * Most products are "contact for price"; a fixed price is the exception. Treating that as the normal case is a
 * deliberate UI decision, so the check lives here rather than being re-derived in each component.
 */
export function hasFixedPrice(price: Price | null | undefined): boolean {
  return price?.type === "FIXED" && typeof price.amount === "number";
}
