import { sealData, unsealData } from "iron-session";
import { internalConfig } from "./config";
import {
  ACCESS_COOKIE,
  INTERNAL_ROOT,
  LOGIN_COOKIE,
  REFRESH_COOKIE,
  sessionFromAccessToken,
  type AccessSession,
  type LoginAttempt,
  type RefreshSession,
} from "./tokens";

/** Keycloak's default SSO idle timeout; used when the token response does not say how long the session lasts. */
const DEFAULT_SESSION_SECONDS = 30 * 60;
const LOGIN_ATTEMPT_SECONDS = 10 * 60;

export interface CookieToSet {
  name: string;
  value: string;
  options: {
    httpOnly: true;
    secure: boolean;
    sameSite: "lax";
    path: string;
    maxAge: number;
  };
}

function cookie(name: string, value: string, maxAge: number): CookieToSet {
  return {
    name,
    value,
    // `Path=/noi-bo`: the public site never receives these cookies, so its pages stay cacheable and anonymous.
    options: {
      httpOnly: true,
      secure: internalConfig.secureCookies,
      sameSite: "lax",
      path: INTERNAL_ROOT,
      maxAge,
    },
  };
}

async function seal(data: object, ttl: number): Promise<string> {
  return sealData(data, { password: internalConfig.sessionSecret, ttl });
}

async function unseal<T>(value: string | undefined): Promise<T | null> {
  if (!value) return null;
  try {
    const data = await unsealData<T>(value, { password: internalConfig.sessionSecret });
    // iron-session answers an expired or tampered seal with an empty object.
    return data && Object.keys(data).length > 0 ? data : null;
  } catch {
    return null;
  }
}

export interface TokenSet {
  accessToken: string;
  refreshToken?: string;
  /** Lifetime of the refresh token (the SSO session), in seconds. */
  sessionSeconds?: number;
}

/** The two session cookies for a token response, or `null` when the access token is not usable. */
export async function sessionCookies(
  tokens: TokenSet,
): Promise<{ session: AccessSession; cookies: CookieToSet[] } | null> {
  const session = sessionFromAccessToken(tokens.accessToken);
  if (!session) return null;
  const lifetime = tokens.sessionSeconds ?? DEFAULT_SESSION_SECONDS;
  const cookies = [cookie(ACCESS_COOKIE, await seal(session, lifetime), lifetime)];
  if (tokens.refreshToken) {
    const refresh: RefreshSession = { refreshToken: tokens.refreshToken };
    cookies.push(cookie(REFRESH_COOKIE, await seal(refresh, lifetime), lifetime));
  }
  return { session, cookies };
}

export function clearedSessionCookies(): CookieToSet[] {
  return [cookie(ACCESS_COOKIE, "", 0), cookie(REFRESH_COOKIE, "", 0)];
}

export function readAccessSession(value: string | undefined): Promise<AccessSession | null> {
  return unseal<AccessSession>(value);
}

export function readRefreshSession(value: string | undefined): Promise<RefreshSession | null> {
  return unseal<RefreshSession>(value);
}

export async function loginAttemptCookie(attempt: LoginAttempt): Promise<CookieToSet> {
  return cookie(LOGIN_COOKIE, await seal(attempt, LOGIN_ATTEMPT_SECONDS), LOGIN_ATTEMPT_SECONDS);
}

export function clearedLoginAttemptCookie(): CookieToSet {
  return cookie(LOGIN_COOKIE, "", 0);
}

export function readLoginAttempt(value: string | undefined): Promise<LoginAttempt | null> {
  return unseal<LoginAttempt>(value);
}
