import type { Metadata } from "next";
import { Barlow, Barlow_Condensed, IBM_Plex_Mono } from "next/font/google";
import { env } from "@/lib/env";
import "./globals.css";

// Barlow: a grotesk drawn after road and industrial signage, with a Vietnamese subset so diacritic stacks such as
// "ế", "ượ" and "ỗ" come from the face itself. The condensed cut sets headings — long product names fit on one
// line and read like stamped plate lettering — and the normal width sets everything else.
const sans = Barlow({
  variable: "--font-barlow",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const display = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  display: "swap",
});

// Part numbers only. Read and compared character by character, so "1613900100" must never be ambiguous: the zero
// is marked and the one has a serifed foot, so neither passes for O or l.
const mono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  // Vietnamese only in v1 (decision D5), but declared so the crawler does not have to guess.
  other: { "content-language": "vi" },
  title: {
    default: "Kim Long — Phụ tùng máy nén khí & thiết bị tự động hóa",
    template: "%s | Kim Long",
  },
  description:
    "Cung cấp phụ tùng máy nén khí chính hãng và thiết bị tự động hóa công nghiệp: Atlas Copco, " +
    "Ingersoll Rand, Festo, IFM, B&R, Lenze, MAC. Báo giá nhanh, giao hàng toàn quốc.",
  // Defaults for every page; individual pages override title, description and images.
  openGraph: { type: "website", siteName: "Kim Long", locale: "vi_VN" },
  twitter: { card: "summary_large_image" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

/**
 * Only what every page shares: the document, the fonts and the default metadata. The public site's header and
 * footer live in `(site)/layout.tsx` and the staff area's frame in `(internal)/noi-bo/layout.tsx`; route groups
 * do not appear in URLs, so no public address changed when the pages moved.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body
        className={`${sans.variable} ${display.variable} ${mono.variable} font-sans text-[17px] antialiased sm:text-base`}
      >
        {children}
      </body>
    </html>
  );
}
