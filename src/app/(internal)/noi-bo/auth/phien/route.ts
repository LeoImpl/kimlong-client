import { getSession } from "@/lib/internal/session";

/**
 * Keep-alive for an open tab. The request passes through the proxy, which renews the tokens; without it a
 * salesperson who spends half an hour on one quotation would be signed out by Keycloak's idle timeout.
 */
export async function GET() {
  const session = await getSession();
  return new Response(null, { status: session ? 204 : 401 });
}
