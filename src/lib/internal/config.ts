/**
 * Configuration of the internal area. Read lazily: `next build` must not need a Keycloak or a session secret, and
 * the public site must keep working when they are missing.
 */

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}: the internal area (/noi-bo) cannot work without it. See .env.example.`,
    );
  }
  return value;
}

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export const internalConfig = {
  /** The realm as the salesperson's browser reaches it, e.g. `https://sso.kimlongvn.com/realms/kimlong`. */
  get issuerUrl(): string {
    return trimSlash(required("KEYCLOAK_ISSUER_URL"));
  },
  /**
   * The same realm as this server reaches it, when that differs (in Docker the browser uses a public address
   * and the Next server the service name). Empty means "same as the issuer".
   */
  get backchannelUrl(): string | undefined {
    const value = process.env.KEYCLOAK_BACKCHANNEL_URL?.trim();
    return value ? trimSlash(value) : undefined;
  },
  get clientId(): string {
    return required("KEYCLOAK_CLIENT_ID");
  },
  get clientSecret(): string {
    return required("KEYCLOAK_CLIENT_SECRET");
  },
  /** Encrypts the session cookies. At least 32 characters; changing it signs everybody out. */
  get sessionSecret(): string {
    const value = required("SESSION_SECRET");
    if (value.length < 32) {
      throw new Error("SESSION_SECRET must be at least 32 characters long.");
    }
    return value;
  },
  /** The public origin of this app, for the redirect URI registered in Keycloak. */
  get siteUrl(): string {
    return trimSlash(process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000");
  },
  /** Cookies are `Secure` whenever the site itself is served over HTTPS. */
  get secureCookies(): boolean {
    return this.siteUrl.startsWith("https://");
  },
};
