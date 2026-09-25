import { Suspense } from "react";
import { connection } from "next/server";
import { MessageCircle, Phone } from "lucide-react";
import { formatPhone, getCompany, primaryHotline, telHref, zaloHref } from "@/lib/api/company";

/**
 * Sticky call/Zalo bar on phones. A large share of Vietnamese B2B buyers would rather phone than fill in a form,
 * and on a phone the hotline in the footer is three screens away — so it follows them down the page.
 *
 * Its height is reserved by a spacer in the layout, otherwise it would cover the last lines of every page.
 */
export function MobileContactBar() {
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}

async function Bar() {
  await connection();
  const company = await getCompany();
  const hotline = primaryHotline(company);
  if (!hotline) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-2 border-t border-line bg-page md:hidden">
      <a
        href={telHref(hotline.phone)}
        className="flex h-14 items-center justify-center gap-2 bg-navy text-sm font-semibold text-white"
      >
        <Phone className="size-4" strokeWidth={1.5} aria-hidden />
        Gọi {formatPhone(hotline.phone)}
      </a>
      <a
        href={zaloHref(hotline.phone)}
        target="_blank"
        rel="noopener"
        className="flex h-14 items-center justify-center gap-2 border-l border-line text-sm font-semibold text-ink"
      >
        <MessageCircle className="size-4" strokeWidth={1.5} aria-hidden />
        Chat Zalo
      </a>
    </div>
  );
}
