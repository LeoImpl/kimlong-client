import type { Metadata } from "next";

/**
 * Everything under /noi-bo: the staff area. It shares the document and fonts with the public site and nothing
 * else — no header, no footer, no link from either side to the other — and wears its own colours
 * (`.theme-internal` in globals.css).
 */
export const metadata: Metadata = {
  title: { default: "Nội bộ", template: "%s | Kim Long nội bộ" },
  description: "Khu vực làm việc nội bộ của Kim Long.",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  openGraph: undefined,
  twitter: undefined,
};

export default function InternalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="theme-internal min-h-dvh text-body">{children}</div>;
}
