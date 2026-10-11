import { NextResponse, type NextRequest } from "next/server";
import {
  clearedLoginAttemptCookie,
  readLoginAttempt,
  sessionCookies,
} from "@/lib/internal/cookies";
import { internalConfig } from "@/lib/internal/config";
import { completeLogin } from "@/lib/internal/oidc";
import {
  FORBIDDEN_PATH,
  LOGIN_COOKIE,
  LOGIN_PATH,
  isStaff,
  safeNextPath,
} from "@/lib/internal/tokens";

/** Keycloak redirects here with the authorization code; the session cookies are created and the code is gone. */
export async function GET(request: NextRequest) {
  // Redirects use the configured origin: behind a reverse proxy `request.url` is the internal address.
  const to = (path: string) => new URL(path, internalConfig.siteUrl);
  const failed = (reason: string) => {
    const login = to(LOGIN_PATH);
    login.searchParams.set("loi", reason);
    const response = NextResponse.redirect(login);
    const cleared = clearedLoginAttemptCookie();
    response.cookies.set(cleared.name, cleared.value, cleared.options);
    return response;
  };

  const attempt = await readLoginAttempt(request.cookies.get(LOGIN_COOKIE)?.value);
  // No attempt cookie: the login took more than ten minutes, or the callback URL was opened out of the blue.
  if (!attempt) return failed("het-han");

  let cookies;
  try {
    cookies = await sessionCookies(await completeLogin(request.nextUrl.search, attempt));
  } catch (error) {
    console.error("Staff login failed at the callback", error);
    return failed("dang-nhap");
  }
  if (!cookies) return failed("dang-nhap");

  // A customer account can sign in at Keycloak; it gets a session so the "no access" page can offer to sign out,
  // but every page and the API refuse it.
  const destination = isStaff(cookies.session.user.roles)
    ? safeNextPath(attempt.next)
    : FORBIDDEN_PATH;
  const response = NextResponse.redirect(to(destination));
  for (const cookie of [...cookies.cookies, clearedLoginAttemptCookie()]) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }
  return response;
}
