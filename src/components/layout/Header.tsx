import { Suspense } from "react";
import { connection } from "next/server";
import { getCategories } from "@/lib/api/catalog";
import { formatPhone, getCompany, primaryHotline, telHref, zaloHref } from "@/lib/api/company";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Feedback";
import { CategoryNav } from "./CategoryNav";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { SearchBox } from "./SearchBox";
import { routes } from "@/lib/routes";

/**
 * The site shell's top half.
 *
 * Every part that needs the API sits behind its own `<Suspense>`: the frame — logo, search box, call to action —
 * is static HTML in the build, and the category tree and phone number stream in on the first request and are
 * then served from the cache. That keeps `next build` independent of a running backend (see AGENTS.md and the
 * Phase 0 notes) and means an API blip degrades the navigation, not the whole page.
 */
export function Header() {
  return (
    <header>
      <div className="hidden border-b border-line bg-surface md:block">
        <Container className="flex h-9 items-center justify-between text-xs text-muted">
          <p>Phụ tùng máy nén khí &amp; thiết bị tự động hóa — giao hàng toàn quốc</p>
          <Suspense fallback={<Skeleton className="h-3 w-56" />}>
            <ContactStrip />
          </Suspense>
        </Container>
      </div>

      <div className="sticky top-0 z-40 border-b border-line bg-page">
        <Container className="flex h-16 items-center gap-4">
          <Logo />
          <div className="hidden flex-1 justify-center px-4 md:flex">
            <SearchBox className="max-w-xl" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ButtonLink href={routes.quote} size="sm" className="hidden sm:inline-flex">
              Yêu cầu báo giá
            </ButtonLink>
            <ButtonLink
              href={routes.contact}
              variant="secondary"
              size="sm"
              className="hidden lg:inline-flex"
            >
              Liên hệ
            </ButtonLink>
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
    <p className="flex items-center gap-4">
      <a href={telHref(hotline.phone)} className="font-medium text-brand-700 hover:underline">
        Hotline {formatPhone(hotline.phone)}
      </a>
      <a
        href={zaloHref(hotline.phone)}
        target="_blank"
        rel="noopener"
        className="hover:text-brand-700"
      >
        Zalo
      </a>
      <a href={`mailto:${company.email}`} className="hover:text-brand-700">
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
