import * as oidc from "openid-client";
import { internalConfig } from "./config";
import type { TokenSet } from "./cookies";
import { AUTH_CALLBACK_PATH, type LoginAttempt } from "./tokens";

/**
 * OpenID Connect against Keycloak: Authorization Code with PKCE, as a confidential client. Everything here runs
 * on the Next server; the browser only ever follows two redirects.
 */

let cached: Promise<oidc.Configuration> | undefined;

/**
 * When this server reaches Keycloak at another address than the browser does, the discovery document still names
 * the public address. Requests are re-pointed at the back-channel address; the issuer in tokens stays the public
 * one, which is what gets validated.
 */
function rewrite(issuerUrl: string, backchannelUrl: string): (url: string) => string {
  const from = new URL(issuerUrl).origin;
  const to = new URL(backchannelUrl).origin;
  return (url) => (url.startsWith(from) ? to + url.slice(from.length) : url);
}

function backchannelFetch(issuerUrl: string, backchannelUrl: string): oidc.CustomFetch {
  const toBackchannel = rewrite(issuerUrl, backchannelUrl);
  return (url, options) => fetch(toBackchannel(url), options as RequestInit);
}

async function discover(): Promise<oidc.Configuration> {
  const issuerUrl = internalConfig.issuerUrl;
  const backchannelUrl = internalConfig.backchannelUrl;
  // Plain HTTP is accepted for local development only; a production realm is HTTPS.
  const insecure = issuerUrl.startsWith("http://") || backchannelUrl?.startsWith("http://");
  const options: oidc.DiscoveryRequestOptions = {
    execute: insecure ? [oidc.allowInsecureRequests] : [],
    timeout: 10,
  };
  if (backchannelUrl) options[oidc.customFetch] = backchannelFetch(issuerUrl, backchannelUrl);
  const config = await oidc.discovery(
    new URL(issuerUrl),
    internalConfig.clientId,
    internalConfig.clientSecret,
    undefined,
    options,
  );
  if (backchannelUrl) config[oidc.customFetch] = backchannelFetch(issuerUrl, backchannelUrl);
  return config;
}

/** Discovery is done once per process; a failed attempt is not remembered, so a Keycloak restart heals itself. */
function configuration(): Promise<oidc.Configuration> {
  cached ??= discover().catch((error) => {
    cached = undefined;
    throw error;
  });
  return cached;
}

function redirectUri(): string {
  return `${internalConfig.siteUrl}${AUTH_CALLBACK_PATH}`;
}

function toTokenSet(tokens: oidc.TokenEndpointResponse): TokenSet {
  const sessionSeconds = tokens.refresh_expires_in;
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    sessionSeconds:
      typeof sessionSeconds === "number" && sessionSeconds > 0 ? sessionSeconds : undefined,
  };
}

/** Starts a login: what to remember until the callback, and where to send the browser. */
export async function beginLogin(next: string): Promise<{ attempt: LoginAttempt; url: URL }> {
  const config = await configuration();
  const attempt: LoginAttempt = {
    state: oidc.randomState(),
    nonce: oidc.randomNonce(),
    codeVerifier: oidc.randomPKCECodeVerifier(),
    next,
  };
  const url = oidc.buildAuthorizationUrl(config, {
    redirect_uri: redirectUri(),
    scope: "openid profile email",
    state: attempt.state,
    nonce: attempt.nonce,
    code_challenge: await oidc.calculatePKCECodeChallenge(attempt.codeVerifier),
    code_challenge_method: "S256",
  });
  return { attempt, url };
}

/**
 * Exchanges the authorization code. `state`, `nonce` and the PKCE verifier are checked by the library, and the ID
 * token's signature, issuer and audience are validated before the tokens are returned.
 *
 * @param callbackSearch the query string Keycloak redirected back with.
 */
export async function completeLogin(
  callbackSearch: string,
  attempt: LoginAttempt,
): Promise<TokenSet> {
  const config = await configuration();
  // Built from the configured origin, not the request: behind a proxy the request's own URL is the internal one.
  const currentUrl = new URL(`${redirectUri()}${callbackSearch}`);
  const tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
    pkceCodeVerifier: attempt.codeVerifier,
    expectedState: attempt.state,
    expectedNonce: attempt.nonce,
    idTokenExpected: true,
  });
  return toTokenSet(tokens);
}

export async function refreshTokens(refreshToken: string): Promise<TokenSet> {
  const config = await configuration();
  const tokens = await oidc.refreshTokenGrant(config, refreshToken);
  // Keycloak rotates the refresh token only when configured to; keep the old one otherwise.
  return { ...toTokenSet(tokens), refreshToken: tokens.refresh_token ?? refreshToken };
}

/**
 * Ends the Keycloak session over the back channel, so signing out here also signs out of the SSO session and the
 * next person at this computer is asked for a password. Best effort: the local cookies are cleared regardless.
 */
export async function endSession(refreshToken: string): Promise<void> {
  try {
    const config = await configuration();
    const endpoint = config.serverMetadata().end_session_endpoint;
    if (!endpoint) return;
    const backchannelUrl = internalConfig.backchannelUrl;
    const url = backchannelUrl
      ? rewrite(internalConfig.issuerUrl, backchannelUrl)(endpoint)
      : endpoint;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: internalConfig.clientId,
        client_secret: internalConfig.clientSecret,
        refresh_token: refreshToken,
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // The SSO session expires by itself; a sign-out must never fail because Keycloak is unreachable.
  }
}
