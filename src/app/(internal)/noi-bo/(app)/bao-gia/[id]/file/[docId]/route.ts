import { env } from "@/lib/env";
import { requireStaff } from "@/lib/internal/session";
import { SALES_API } from "@/lib/internal/staff-fetch";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Downloads a stored quotation file. The browser has no token and does not know the API host, so this handler
 * fetches the file as the signed-in salesperson and passes it on unchanged. The platform decides whether the
 * quotation is theirs to see; a file of another salesperson's customer answers 404 here too.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/noi-bo/bao-gia/[id]/file/[docId]">,
) {
  const session = await requireStaff();
  const { id, docId } = await params;
  // The IDs go into an upstream URL: accept nothing but UUIDs.
  if (!UUID.test(id) || !UUID.test(docId)) return new Response(null, { status: 404 });

  let upstream: Response;
  try {
    upstream = await fetch(
      `${env.apiBaseUrl}${SALES_API}/quotations/${id}/documents/${docId}/content`,
      { headers: { Authorization: `Bearer ${session.accessToken}` }, cache: "no-store" },
    );
  } catch {
    return new Response("Không kết nối được máy chủ.", { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return new Response(null, { status: upstream.status === 404 ? 404 : 502 });
  }

  const headers = new Headers({
    "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
    "Content-Disposition": upstream.headers.get("Content-Disposition") ?? "attachment",
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
  const length = upstream.headers.get("Content-Length");
  if (length) headers.set("Content-Length", length);
  return new Response(upstream.body, { headers });
}
