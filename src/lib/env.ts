/**
 * Environment configuration.
 *
 * Everything the app needs at runtime comes from environment variables, so the same image can run next to the API
 * stack or on a hosting platform without a rebuild (decision D7 in the plan).
 *
 * `NEXT_PUBLIC_*` values are inlined into the browser bundle at build time and are therefore public. `API_BASE_URL`
 * is deliberately not public: catalogue data is fetched in server components, so the browser never learns the API
 * host and production needs no CORS for it.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value.trim();
}

function url(name: string, value: string | undefined, fallback?: string): string {
  const raw = value?.trim() || fallback;
  if (!raw) return required(name, value);
  try {
    // Trailing slashes make every joined path ambiguous, so normalise them away once here.
    return new URL(raw).toString().replace(/\/$/, "");
  } catch {
    throw new Error(`Environment variable ${name} is not a valid URL: "${raw}"`);
  }
}

export const env = {
  /** Where the platform API lives, as seen from the server. Never exposed to the browser. */
  apiBaseUrl: url("API_BASE_URL", process.env.API_BASE_URL, "http://localhost:8080"),

  /**
   * Where the browser should send the quote request submission. This is the only call made from the client, so
   * it is the only reason the API needs a CORS entry for this app's origin.
   */
  publicApiBaseUrl: url(
    "NEXT_PUBLIC_API_BASE_URL",
    process.env.NEXT_PUBLIC_API_BASE_URL,
    "http://localhost:8080",
  ),

  /** Canonical origin of this site, used for metadata, sitemap and absolute URLs. */
  siteUrl: url("NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL, "http://localhost:3000"),

  /** Language sent as `Accept-Language`. Vietnamese only in v1 (decision D5). */
  language: process.env.NEXT_PUBLIC_LANGUAGE?.trim() || "vi",
} as const;
