import { NextResponse, type NextRequest } from "next/server";
import { loginAttemptCookie } from "@/lib/internal/cookies";
import { beginLogin } from "@/lib/internal/oidc";
import { clientAddress, loginLimiter } from "@/lib/internal/rate-limit";
import { LOGIN_PATH, safeNextPath } from "@/lib/internal/tokens";

/** Starts the login: remembers state, nonce and PKCE verifier in a short-lived cookie and goes to Keycloak. */
export async function GET(request: NextRequest) {
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  if (!loginLimiter.allow(clientAddress(request.headers))) {
    const login = new URL(LOGIN_PATH, request.url);
    login.searchParams.set("loi", "qua-nhieu");
    return NextResponse.redirect(login);
  }
  try {
    const { attempt, url } = await beginLogin(next);
    const cookie = await loginAttemptCookie(attempt);
    const response = NextResponse.redirect(url);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    console.error("Could not start the staff login", error);
    const login = new URL(LOGIN_PATH, request.url);
    login.searchParams.set("loi", "may-chu");
    return NextResponse.redirect(login);
  }
}
