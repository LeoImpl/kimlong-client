import { Suspense } from "react";
import { connection } from "next/server";
import { FileUp, Mail, MessageCircle, Phone } from "lucide-react";
import { getCategories } from "@/lib/api/catalog";
import { formatPhone, getCompany, primaryHotline, telHref, zaloHref } from "@/lib/api/company";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Feedback";
import { BasketBadge } from "./BasketBadge";
import { CategoryNav } from "./CategoryNav";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { SearchBox } from "./SearchBox";
import { routes } from "@/lib/routes";

/**
 * The site shell's top half: a navy utility strip (who to call), the command bar (search, quick order, the quote
 * basket) and the category row.
 *
 * Every part that needs the API sits behind its own `<Suspense>`: the frame — logo, search box, calls to action —
 * is static HTML in the build, and the category tree and phone number stream in on the first request and are
 * then served from the cache. That keeps `next build` independent of a running backend (see AGENTS.md and the
 * Phase 0 notes) and means an API blip degrades the navigation, not the whole page.
 */
export function Header() {
  return (
    <header>
      <div className="hidden bg-navy md:block">
        <Container className="flex h-9 items-center justify-end text-[13px] lg:justify-between text-white/70">
          <p className="hidden lg:block">
            Phụ tùng máy nén khí và thiết bị tự động hóa, giao hàng toàn quốc
          </p>
          <Suspense fallback={<Skeleton className="h-3 w-56 bg-white/10" />}>
            <ContactStrip />
          </Suspense>
        </Container>
      </div>

      <div className="sticky top-0 z-40 border-b border-line bg-page">
        <Container className="flex h-16 items-center gap-3 lg:gap-6">
          <Logo />
          <div className="hidden flex-1 md:flex">
            <SearchBox className="max-w-2xl" shortcut />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ButtonLink
              href={routes.quickOrder}
              size="sm"
              className="h-10"
              aria-label="Đặt hàng nhanh theo mã hoặc tải file CSV"
            >
              <FileUp className="size-4" strokeWidth={1.5} aria-hidden />
              <span className="hidden sm:inline">Đặt nhanh / CSV</span>
            </ButtonLink>
            <BasketBadge />
          </div>
        </Container>
      </div>

      <div className="border-b border-line bg-page">
        <Container className="py-2 md:py-0">
          <div className="mb-2 md:hidden">
            <SearchBox />
          </div>
          <div className="md:hidden">
            <Suspense fallback={<Skeleton className="h-10 w-32" />}>
              <MobileCategories />
            </Suspense>
          </div>
          <Suspense fallback={<NavSkeleton />}>
            <CategoryNav />
          </Suspense>
        </Container>
      </div>
    </header>
  );
}

async function ContactStrip() {
  // Stops the shell from being prerendered against the API at build time; see the file comment.
  await connection();
  const company = await getCompany();
  const hotline = primaryHotline(company);
  if (!hotline) return null;

  return (
    <p className="flex items-center gap-5">
      <a
        href={telHref(hotline.phone)}
        className="flex items-center gap-1.5 font-medium text-white hover:text-brand-300"
      >
        <Phone className="size-3.5" strokeWidth={1.5} aria-hidden />
        <span className="font-mono">{formatPhone(hotline.phone)}</span>
      </a>
      <a
        href={zaloHref(hotline.phone)}
        target="_blank"
        rel="noopener"
        className="flex items-center gap-1.5 hover:text-white"
      >
        <MessageCircle className="size-3.5" strokeWidth={1.5} aria-hidden />
        Zalo
      </a>
      <a href={`mailto:${company.email}`} className="flex items-center gap-1.5 hover:text-white">
        <Mail className="size-3.5" strokeWidth={1.5} aria-hidden />
        {company.email}
      </a>
    </p>
  );
}

async function MobileCategories() {
  await connection();
  return <MobileNav categories={await getCategories()} />;
}

function NavSkeleton() {
  return (
    <div className="hidden h-11 items-center gap-6 lg:flex" aria-hidden>
      {["w-36", "w-28", "w-32", "w-24"].map((width) => (
        <Skeleton key={width} className={`h-3 ${width}`} />
      ))}
    </div>
  );
}
