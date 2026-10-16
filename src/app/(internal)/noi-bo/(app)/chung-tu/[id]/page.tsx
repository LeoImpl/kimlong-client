import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, type Crumb } from "@/components/internal/PageHeader";
import { PaperEditor } from "@/components/internal/PaperEditor";
import { getOrder, getPaper, listPaperFiles, listPaperPlaceholders } from "@/lib/internal/api";
import { formatInstant } from "@/lib/internal/format";
import { internalRoutes } from "@/lib/internal/routes";

export const metadata: Metadata = { title: "Chứng từ" };

/** Private data behind the session: a navigation waits for the server, like every internal page. */
export const instant = false;

export default async function PaperPage({ params }: PageProps<"/noi-bo/chung-tu/[id]">) {
  const { id } = await params;
  const paper = await getPaper(id);
  // Also the answer for a document of another salesperson's customer.
  if (!paper) notFound();
  const [files, placeholders, order, framework] = await Promise.all([
    listPaperFiles(paper.id),
    listPaperPlaceholders(),
    paper.orderId ? getOrder(paper.orderId) : Promise.resolve(null),
    paper.parentId ? getPaper(paper.parentId) : Promise.resolve(null),
  ]);

  const crumbs: Crumb[] = order
    ? [
        { label: "Đơn hàng", href: internalRoutes.orders },
        { label: order.number, href: internalRoutes.order(order.id) },
        { label: paper.label },
      ]
    : [
        { label: "Khách hàng", href: internalRoutes.customers },
        { label: paper.buyer.name, href: internalRoutes.customer(paper.customerId) },
        { label: paper.label },
      ];
  const backHref = order
    ? internalRoutes.order(order.id)
    : internalRoutes.customer(paper.customerId);

  return (
    <>
      <PageHeader
        title={
          <span>
            {paper.label}{" "}
            <span className="font-mono">
              {paper.kind === "ANNEX" ? `số ${paper.number}` : paper.number}
            </span>
          </span>
        }
        description={
          <>
            {paper.buyer.name}
            {framework && (
              <>
                {" "}
                · Thuộc{" "}
                <Link
                  href={internalRoutes.paper(framework.id)}
                  className="font-mono font-medium text-action-600 hover:underline"
                >
                  HĐNT {framework.number}
                </Link>
              </>
            )}{" "}
            · Lập bởi {paper.createdBy.name} lúc {formatInstant(paper.createdAt)}
          </>
        }
        crumbs={crumbs}
      />
      {/* Remounted for another document or version, so the form always starts from what is stored. */}
      <PaperEditor
        key={`${paper.id}-${paper.version}`}
        paper={paper}
        files={files}
        placeholders={placeholders}
        backHref={backHref}
      />
    </>
  );
}
