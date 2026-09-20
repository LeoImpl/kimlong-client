import { Suspense } from "react";
import { connection } from "next/server";
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
    <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-2 border-t border-line bg-page/95 backdrop-blur md:hidden">
      <a
        href={telHref(hotline.phone)}
        className="flex h-14 items-center justify-center gap-2 text-sm font-semibold text-brand-700"
      >
        <PhoneIcon />
        Gọi {formatPhone(hotline.phone)}
      </a>
      <a
        href={zaloHref(hotline.phone)}
        target="_blank"
        rel="noopener"
        className="flex h-14 items-center justify-center gap-2 border-l border-line text-sm font-semibold text-ink"
      >
        <ChatIcon />
        Chat Zalo
      </a>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path d="M4 3h3l1.5 4-2 1.5a10 10 0 0 0 5 5L13 11.5 17 13v3a1 1 0 0 1-1.1 1A14 14 0 0 1 3 4.1 1 1 0 0 1 4 3Z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path d="M17 9.5c0 3.3-3.1 6-7 6-.8 0-1.6-.1-2.3-.3L3.5 16.5l1-2.8A5.8 5.8 0 0 1 3 9.5c0-3.3 3.1-6 7-6s7 2.7 7 6Z" />
    </svg>
  );
}
