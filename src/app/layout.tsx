import type { Metadata } from "next";
import { Barlow, Barlow_Condensed, IBM_Plex_Mono } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileContactBar } from "@/components/layout/MobileContactBar";
import { env } from "@/lib/env";
import "./globals.css";

// Barlow: a grotesk drawn after road and industrial signage, with a Vietnamese subset so diacritic stacks such as
// "ế", "ượ" and "ỗ" come from the face itself. The condensed cut sets headings — long product names fit on one
// line and read like stamped plate lettering — and the normal width sets everything else.
const sans = Barlow({
  variable: "--font-barlow",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const display = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600"],
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body
        className={`${sans.variable} ${display.variable} ${mono.variable} font-sans text-[16px] antialiased sm:text-base`}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Tới nội dung chính
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        {/* Reserves the height of the sticky mobile bar so it never covers the end of the page. */}
        <div className="h-14 md:hidden" aria-hidden />
        <MobileContactBar />
      </body>
    </html>
  );
}
