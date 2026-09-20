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
export type Commercial = Concrete<Schemas["CommercialResponse"]>;
export type MediaFile = Concrete<Schemas["MediaResponse"]>;
export type Facet = Concrete<Schemas["FacetResponse"]>;

/**
 * `Concrete` only reaches the top level, so every nested object has to be restated. Tedious once, but it is what
 * turns `product.variants[0].partNumber` from `string | undefined` into `string` everywhere it is read.
 */
export type Variant = Omit<Concrete<Schemas["VariantResponse"]>, "specifications" | "price"> & {
  specifications: Spec[];
  price: Price | null;
};

export type ProductSummary = Omit<
  Concrete<Schemas["PublicProductSummaryResponse"]>,
  "brand" | "category" | "price"
> & {
  brand: Ref | null;
  category: Ref | null;
  price: Price;
};

export type ProductDetail = Omit<
  Concrete<Schemas["PublicProductDetailResponse"]>,
  | "brand"
  | "categories"
  | "specifications"
  | "variants"
  | "price"
  | "commercial"
  | "images"
  | "documents"
> & {
  brand: Ref | null;
  categories: Ref[];
  specifications: Spec[];
  variants: Variant[];
  price: Price;
  commercial: Commercial;
  images: MediaFile[];
  documents: MediaFile[];
};

export type Facets = { categories: Facet[]; brands: Facet[] };

export type ProductSlug = Concrete<Schemas["ProductSlugResponse"]>;

export type Hotline = Concrete<Schemas["PublicHotline"]>;
export type CompanySection = Concrete<Schemas["PublicSection"]>;
export type Milestone = Concrete<Schemas["PublicMilestone"]>;
export type DocumentLink = Concrete<Schemas["PublicDocumentLink"]>;
export type PartnerBrand = Concrete<Schemas["PublicPartnerBrandResponse"]>;

export type CompanyProfile = Omit<
  Concrete<Schemas["PublicCompanyProfileResponse"]>,
  "hotlines" | "aboutSections" | "highlights" | "milestones" | "technicalDocuments"
> & {
  hotlines: Hotline[];
  aboutSections: CompanySection[];
  highlights: CompanySection[];
  milestones: Milestone[];
  technicalDocuments: DocumentLink[];
};

export type Page<T> = {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

/** Quote request submission. `website` is the honeypot and must always be sent empty. */
export type Contact = Concrete<Schemas["ContactDto"]>;
export type QuoteLine = Concrete<Schemas["LineRequest"]>;
export type Submitted = Concrete<Schemas["SubmittedResponse"]>;

export type SubmitQuoteRequest = Omit<
  Concrete<Schemas["SubmitQuoteRequestDto"]>,
  "contact" | "lines"
> & {
  contact: Contact;
  lines: QuoteLine[];
};

/**
 * Most products are "contact for price"; a fixed price is the exception. Treating that as the normal case is a
 * deliberate UI decision, so the check lives here rather than being re-derived in each component.
 */
export function hasFixedPrice(price: Price | null | undefined): boolean {
  return price?.type === "FIXED" && typeof price.amount === "number";
}
