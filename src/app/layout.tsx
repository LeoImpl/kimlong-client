import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileContactBar } from "@/components/layout/MobileContactBar";
import { env } from "@/lib/env";
import "./globals.css";

// Be Vietnam Pro is drawn for Vietnamese: diacritic stacks such as "ế", "ượ" and "ỗ" sit correctly instead of
// colliding with the line above, which many Latin faces get wrong at small sizes.
const sans = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Part numbers are read and compared character by character, so "1613900100" must never be ambiguous.
const mono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "Kim Long — Phụ tùng máy nén khí & thiết bị tự động hóa",
    template: "%s | Kim Long",
  },
  description:
    "Cung cấp phụ tùng máy nén khí chính hãng và thiết bị tự động hóa công nghiệp: Atlas Copco, " +
    "Ingersoll Rand, Festo, IFM, B&R, Lenze, MAC. Báo giá nhanh, giao hàng toàn quốc.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={`${sans.variable} ${mono.variable} font-sans antialiased`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
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
