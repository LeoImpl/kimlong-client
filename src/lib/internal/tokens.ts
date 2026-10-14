/**
 * The staff session, as pure functions so they can be unit-tested and shared by the proxy, the route handlers and
 * the server components.
 *
 * A session is two encrypted, `httpOnly` cookies scoped to `/noi-bo`: the access token with the user it belongs
 * to, and the refresh token. They are separate because a cookie may hold at most 4 KB and a Keycloak access token
 * is already a third of that. The browser can neither read nor forge them, and never sees a token.
 */

export const ACCESS_COOKIE = "kl_staff";
export const REFRESH_COOKIE = "kl_staff_rt";
/** Holds the PKCE verifier, state and nonce between the redirect to Keycloak and the callback. */
export const LOGIN_COOKIE = "kl_staff_login";

export const INTERNAL_ROOT = "/noi-bo";
export const LOGIN_PATH = "/noi-bo/dang-nhap";
export const FORBIDDEN_PATH = "/noi-bo/khong-co-quyen";
export const AUTH_START_PATH = "/noi-bo/auth/dang-nhap";
export const AUTH_CALLBACK_PATH = "/noi-bo/auth/callback";
export const AUTH_LOGOUT_PATH = "/noi-bo/auth/dang-xuat";
export const AUTH_KEEPALIVE_PATH = "/noi-bo/auth/phien";

/** Realm roles that may use the internal area (decision Q5). */
export const STAFF_ROLES = ["ADMIN", "STAFF"] as const;

export interface StaffUser {
  /** Keycloak subject: the stable ID the platform stores as the salesperson in charge. */
  id: string;
  username: string;
  name: string;
  email?: string;
  roles: string[];
}

export interface AccessSession {
  user: StaffUser;
  accessToken: string;
  /** Expiry of the access token, in seconds since the epoch. */
  expiresAt: number;
}

export interface RefreshSession {
  refreshToken: string;
}

export interface LoginAttempt {
  state: string;
  nonce: string;
  codeVerifier: string;
  next: string;
}

export function isStaff(roles: readonly string[]): boolean {
  return STAFF_ROLES.some((role) => roles.includes(role));
}

export function isAdmin(roles: readonly string[]): boolean {
  return roles.includes("ADMIN");
}

/** Refresh a little early, so a token never expires between the proxy and the API call a page makes. */
export const REFRESH_LEEWAY_SECONDS = 60;

export function isExpired(session: AccessSession, nowSeconds: number, leewaySeconds = 0): boolean {
  return session.expiresAt - leewaySeconds <= nowSeconds;
}

/**
 * Where to go after signing in. Only paths inside the internal area are accepted: `next` comes from the query
 * string, and sending a freshly signed-in salesperson to an attacker's URL is the classic open redirect.
 */
export function safeNextPath(value: string | null | undefined): string {
  if (!value) return INTERNAL_ROOT;
  // "//evil.com" and "/\evil.com" are scheme-relative URLs to a browser; control characters hide them.
  if (!value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f]/.test(value)) {
    return INTERNAL_ROOT;
  }
  let url: URL;
  try {
    url = new URL(value, "http://internal.invalid");
  } catch {
    return INTERNAL_ROOT;
  }
  if (url.origin !== "http://internal.invalid") return INTERNAL_ROOT;
  const inside = url.pathname === INTERNAL_ROOT || url.pathname.startsWith(`${INTERNAL_ROOT}/`);
  // Returning to the login or sign-out endpoints would loop.
  const authPage =
    url.pathname === LOGIN_PATH ||
    url.pathname === FORBIDDEN_PATH ||
    url.pathname.startsWith(`${INTERNAL_ROOT}/auth/`);
  if (!inside || authPage) return INTERNAL_ROOT;
  return `${url.pathname}${url.search}`;
}

/** Paths of the internal area that must work without a session. */
export function isOpenPath(pathname: string): boolean {
  return (
    pathname === LOGIN_PATH ||
    pathname === AUTH_START_PATH ||
    pathname === AUTH_CALLBACK_PATH ||
    pathname === AUTH_LOGOUT_PATH
  );
}

interface AccessTokenClaims {
  sub?: string;
  preferred_username?: string;
  name?: string;
  email?: string;
  exp?: number;
  realm_access?: { roles?: unknown };
}

function decodeSegment(segment: string): string {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Reads the user and expiry out of a Keycloak access token.
 *
 * The signature is not checked here, on purpose: the token was received straight from Keycloak's token endpoint
 * over the back channel, and it is only used to decide what to *show*. The platform verifies the signature on
 * every API call, so a role that is not really in the token gets no data.
 */
export function sessionFromAccessToken(accessToken: string): AccessSession | null {
  const [, payload] = accessToken.split(".");
  if (!payload) return null;
  let claims: AccessTokenClaims;
  try {
    claims = JSON.parse(decodeSegment(payload)) as AccessTokenClaims;
  } catch {
    return null;
  }
  if (!claims.sub || typeof claims.exp !== "number") return null;
  const roles = Array.isArray(claims.realm_access?.roles)
    ? claims.realm_access.roles.filter((role): role is string => typeof role === "string")
    : [];
  const username = claims.preferred_username ?? claims.sub;
  return {
    user: {
      id: claims.sub,
      username,
      name: claims.name?.trim() || username,
      email: claims.email,
      // Only the roles this app acts on; Keycloak adds several of its own.
      roles: roles.filter((role) => role === "ADMIN" || role === "STAFF" || role === "CUSTOMER"),
    },
    accessToken,
    expiresAt: claims.exp,
  };
}
