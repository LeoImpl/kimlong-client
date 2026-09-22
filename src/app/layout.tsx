import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileContactBar } from "@/components/layout/MobileContactBar";
import { env } from "@/lib/env";
import "./globals.css";

// Plus Jakarta Sans: a geometric grotesque with a Vietnamese subset, so diacritic stacks such as "ế", "ượ" and
// "ỗ" come from the face itself rather than a fallback font.
const sans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Part numbers are read and compared character by character, so "1613900100" must never be ambiguous.
const mono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
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
      <body className={`${sans.variable} ${mono.variable} font-sans antialiased`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Tới nội dung chính
        </a>
        <Header />
        <main id="main" className="relative isolate">
          {/* A tinted blueprint band behind the top of every page; the home hero paints over it. */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 overflow-hidden"
            aria-hidden
          >
            <div className="absolute -top-32 left-[10%] size-96 rounded-full bg-brand-200/50 blur-3xl" />
            <div className="absolute -top-24 right-[5%] size-80 rounded-full bg-cyan-200/40 blur-3xl" />
            <div className="bg-blueprint bg-blueprint-fade absolute inset-0" />
          </div>
          {children}
        </main>
        <Footer />
        {/* Reserves the height of the sticky mobile bar so it never covers the end of the page. */}
        <div className="h-14 md:hidden" aria-hidden />
        <MobileContactBar />
      </body>
    </html>
  );
}
