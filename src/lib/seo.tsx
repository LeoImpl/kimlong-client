import { env } from "@/lib/env";
import { routes } from "@/lib/routes";
import type { CompanyProfile, ProductDetail } from "@/lib/api/types";

/**
 * Structured data.
 *
 * It matters more here than on most sites: a rich result that shows the part numbers and "Liên hệ để báo giá"
 * is what distinguishes this listing from the competitors already ranking for the same numbers.
 *
 * `JSON.stringify` does not escape `<`, so a product name containing markup would break out of the script tag.
 * [jsonLd] escapes it, and every payload on the site goes through it.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function absoluteUrl(path: string): string {
  return new URL(path, env.siteUrl).toString();
}

/**
 * `Product` with an `Offer`. Almost everything here is contact-for-price, which schema.org expresses as an offer
 * with no price and `InStock` availability — omitting the offer entirely would lose the seller and the currency,
 * which are what make the result look like a real shop.
 */
export function productJsonLd(product: ProductDetail, company: CompanyProfile | null) {
  const images = product.images.map((image) => absoluteUrl(image.url));
  const fixedPrice = product.price.type === "FIXED" && product.price.amount != null;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: absoluteUrl(routes.product(product.slug)),
    ...(images.length > 0 && { image: images }),
    ...(product.summary && { description: product.summary }),
    ...(product.brand && { brand: { "@type": "Brand", name: product.brand.name } }),
    // Part numbers are what people search for, so every one of them is declared.
    ...(product.variants.length > 0 && {
      mpn: product.variants[0].partNumber,
      sku: product.variants[0].partNumber,
      hasVariant: product.variants.map((variant) => ({
        "@type": "Product",
        name: `${product.name} ${variant.partNumber}`,
        mpn: variant.partNumber,
        sku: variant.partNumber,
      })),
    }),
    ...(product.specifications.length > 0 && {
      additionalProperty: product.specifications.map((spec) => ({
        "@type": "PropertyValue",
        name: spec.name,
        value: spec.value,
      })),
    }),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(routes.product(product.slug)),
      availability: "https://schema.org/InStock",
      priceCurrency: fixedPrice ? (product.price.currency ?? "VND") : "VND",
      ...(fixedPrice
        ? { price: product.price.amount }
        : // No price published: the buyer asks. Google accepts an offer without a price when it is declared this way.
          { priceSpecification: { "@type": "PriceSpecification", priceCurrency: "VND" } }),
      ...(company && { seller: { "@type": "Organization", name: company.legalName } }),
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function organizationJsonLd(company: CompanyProfile) {
  const phones = [...new Set(company.hotlines.map((hotline) => hotline.phone))];

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.legalName,
    alternateName: company.shortName,
    url: env.siteUrl,
    ...(company.tagline && { description: company.tagline }),
    ...(company.foundedYear && { foundingDate: String(company.foundedYear) }),
    ...(company.taxCode && { taxID: company.taxCode }),
    email: company.email,
    ...(company.headquarters && {
      address: {
        "@type": "PostalAddress",
        addressLocality: company.headquarters,
        addressCountry: "VN",
      },
    }),
    ...(phones.length > 0 && {
      contactPoint: phones.map((phone) => ({
        "@type": "ContactPoint",
        telephone: phone,
        contactType: "sales",
        areaServed: "VN",
        availableLanguage: ["vi"],
      })),
    }),
  };
}

/** Renders one structured-data block. Server-rendered, so crawlers see it without running JavaScript. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />;
}
