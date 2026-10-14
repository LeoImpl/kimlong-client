import { NextResponse, type NextRequest } from "next/server";
import {
  clearedSessionCookies,
  readAccessSession,
  readRefreshSession,
  sessionCookies,
  type CookieToSet,
} from "@/lib/internal/cookies";
import { refreshTokens } from "@/lib/internal/oidc";
import {
  ACCESS_COOKIE,
  AUTH_KEEPALIVE_PATH,
  FORBIDDEN_PATH,
  LOGIN_PATH,
  REFRESH_COOKIE,
  REFRESH_LEEWAY_SECONDS,
  isExpired,
  isOpenPath,
  isStaff,
  safeNextPath,
} from "@/lib/internal/tokens";

/**
 * The first of three access checks for the internal area, and the place where the session is kept alive.
 *
 * Next only allows cookies to be written here, in route handlers and in server actions — not while a page renders.
 * Keycloak access tokens live five minutes, so this is where an expiring one is exchanged: before the page runs,
 * with the new cookies handed both to the page (on the request) and to the browser (on the response).
 *
 * This is an early exit, not the security boundary: `requireStaff()` checks the role on the server, and the
 * platform API checks the token itself. It only matches `/noi-bo`, so the public site never runs it.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (isOpenPath(pathname)) return private_(NextResponse.next());

  const now = Math.floor(Date.now() / 1000);
  const access = await readAccessSession(request.cookies.get(ACCESS_COOKIE)?.value);
  if (access && !isExpired(access, now, REFRESH_LEEWAY_SECONDS)) {
    return private_(allow(request, access.user.roles));
  }

  const refresh = await readRefreshSession(request.cookies.get(REFRESH_COOKIE)?.value);
  if (refresh) {
    try {
      const renewed = await sessionCookies(await refreshTokens(refresh.refreshToken));
      if (renewed) {
        for (const cookie of renewed.cookies) request.cookies.set(cookie.name, cookie.value);
        const response = allow(request, renewed.session.user.roles, true);
        return private_(withCookies(response, renewed.cookies));
      }
    } catch {
      // The SSO session ended (idle too long, signed out elsewhere, Keycloak restarted): sign in again.
    }
  }

  // The access token may still be good for a few seconds; a page that renders with it is better than a redirect
  // in the middle of someone's work.
  if (access && !isExpired(access, now)) return private_(allow(request, access.user.roles));

  if (pathname === AUTH_KEEPALIVE_PATH) {
    return private_(withCookies(new NextResponse(null, { status: 401 }), clearedSessionCookies()));
  }
  // A server action is a fetch: answering it with a redirect to an HTML page breaks the caller. Let it through;
  // `requireStaff()` in the action redirects in the way the action runtime understands.
  if (request.method !== "GET" && request.method !== "HEAD") return private_(NextResponse.next());

  const login = new URL(LOGIN_PATH, request.url);
  const next = safeNextPath(`${pathname}${search}`);
  if (next !== "/noi-bo") login.searchParams.set("next", next);
  return private_(withCookies(NextResponse.redirect(login), clearedSessionCookies()));
}

/**
 * A signed-in account without a staff role (a customer who registered on the realm) only ever sees the "no
 * access" page. `forwardRequest` passes cookies that were just renewed on to the page being rendered.
 */
function allow(request: NextRequest, roles: string[], forwardRequest = false): NextResponse {
  const { pathname } = request.nextUrl;
  const readOnly = request.method === "GET" || request.method === "HEAD";
  if (
    !isStaff(roles) &&
    readOnly &&
    pathname !== FORBIDDEN_PATH &&
    pathname !== AUTH_KEEPALIVE_PATH
  ) {
    return NextResponse.redirect(new URL(FORBIDDEN_PATH, request.url));
  }
  return forwardRequest ? NextResponse.next({ request }) : NextResponse.next();
}

function withCookies(response: NextResponse, cookies: CookieToSet[]): NextResponse {
  for (const cookie of cookies) response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}

/** Nothing under /noi-bo may be stored by a browser or a proxy, or shown in a search result. */
function private_(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: ["/noi-bo", "/noi-bo/:path*"],
};
