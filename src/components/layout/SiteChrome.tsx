import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileContactBar } from "@/components/layout/MobileContactBar";

/**
 * The frame of the public site: skip link, header, footer and the mobile contact bar. Shared by the `(site)`
 * layout and the global 404, which Next renders in the root layout only.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
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
    </>
  );
}
