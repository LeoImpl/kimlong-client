import { NextResponse, type NextRequest } from "next/server";
import { clearedSessionCookies, readRefreshSession } from "@/lib/internal/cookies";
import { internalConfig } from "@/lib/internal/config";
import { endSession } from "@/lib/internal/oidc";
import { LOGIN_PATH, REFRESH_COOKIE } from "@/lib/internal/tokens";

/**
 * Signs out: ends the Keycloak session and removes the cookies. POST only, so a link or an image on another site
 * cannot sign a salesperson out (the session cookies are `SameSite=Lax` and are not sent on a cross-site POST).
 */
export async function POST(request: NextRequest) {
  // Defence in depth on top of SameSite: a form on another origin is refused outright.
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(internalConfig.siteUrl).origin) {
    return new NextResponse(null, { status: 403 });
  }
  const refresh = await readRefreshSession(request.cookies.get(REFRESH_COOKIE)?.value);
  if (refresh) await endSession(refresh.refreshToken);

  const login = new URL(LOGIN_PATH, internalConfig.siteUrl);
  login.searchParams.set("da-dang-xuat", "1");
  // 303: the browser follows a POST with a GET.
  const response = NextResponse.redirect(login, 303);
  for (const cookie of clearedSessionCookies()) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }
  return response;
}
