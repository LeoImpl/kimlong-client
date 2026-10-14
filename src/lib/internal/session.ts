import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readAccessSession } from "./cookies";
import {
  ACCESS_COOKIE,
  FORBIDDEN_PATH,
  LOGIN_PATH,
  isAdmin,
  isExpired,
  isStaff,
  type AccessSession,
} from "./tokens";

/**
 * The second of three access checks (the proxy is the first, the platform API the last). Every internal page,
 * server action and route handler goes through `requireStaff()`: a server action is a public POST endpoint, so
 * "the page was protected" protects nothing.
 */

/** The signed-in person, or `null`. Read once per request. */
export const getSession = cache(async (): Promise<AccessSession | null> => {
  const store = await cookies();
  const session = await readAccessSession(store.get(ACCESS_COOKIE)?.value);
  if (!session || isExpired(session, Math.floor(Date.now() / 1000))) return null;
  return session;
});

/** The signed-in salesperson or administrator; anyone else is sent away and this never returns. */
export async function requireStaff(): Promise<AccessSession> {
  const session = await getSession();
  if (!session) redirect(LOGIN_PATH);
  // Signed in at Keycloak, but with a customer account (self-registration is open on the realm).
  if (!isStaff(session.user.roles)) redirect(FORBIDDEN_PATH);
  return session;
}

export async function requireAdmin(): Promise<AccessSession> {
  const session = await requireStaff();
  if (!isAdmin(session.user.roles)) redirect(FORBIDDEN_PATH);
  return session;
}
