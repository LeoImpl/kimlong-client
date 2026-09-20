/**
 * Phone helpers, kept out of `lib/api/company.ts` on purpose: that module contains `use cache` server functions,
 * and a client component importing a formatter from it would drag the whole server module into the browser
 * bundle — which Next refuses to build.
 */

/** Vietnamese mobile numbers are written 0981 577 876 but must be dialled without the spaces. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Zalo's deep link wants the bare digits. */
export function zaloHref(phone: string): string {
  return `https://zalo.me/${phone.replace(/\D/g, "")}`;
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10
    ? `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
    : phone;
}
