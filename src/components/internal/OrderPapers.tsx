"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FilePlus2, FileSignature, ReceiptText, Truck } from "lucide-react";
import {
  createFrameworkWithAnnexAction,
  createPaperAction,
} from "@/app/(internal)/noi-bo/(app)/chung-tu/actions";
import { FormMessage } from "@/components/internal/FormMessage";
import { Panel } from "@/components/internal/PageHeader";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import type { ActionResult } from "@/lib/internal/action-result";
import { formatDay, formatVnd } from "@/lib/internal/format";
import { internalRoutes } from "@/lib/internal/routes";
import type { Paper, PaperKind, SalesOrder } from "@/lib/internal/types";

/**
 * The paperwork of a won order, in the order it is usually done: the legal basis (a sales contract, or an annex of
 * the customer's framework contract), then payment requests and delivery notes. Each one opens in its own page to
 * be checked, edited and exported to Word or PDF.
 */
export function OrderPapers({
  order,
  papers,
  frameworks,
}: {
  order: SalesOrder;
  papers: Paper[];
  frameworks: Paper[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<unknown> | null>(null);
  const [frameworkId, setFrameworkId] = useState(frameworks[0]?.id ?? "");
  const basis = papers.find((paper) => paper.kind === "SALE_CONTRACT" || paper.kind === "ANNEX");
  const requests = papers.filter((paper) => paper.kind === "PAYMENT_REQUEST");
  const notes = papers.filter((paper) => paper.kind === "DELIVERY_NOTE");
  const closed = order.cancelled;

  function open(response: ActionResult<{ id: string }>) {
    setResult(response);
    if (response.ok) router.push(internalRoutes.paper(response.data.id));
  }

  function create(kind: PaperKind, framework?: string) {
    startTransition(async () => {
      open(await createPaperAction({ kind, orderId: order.id, frameworkId: framework }));
    });
  }

  function createFramework() {
    startTransition(async () => {
      open(await createFrameworkWithAnnexAction(order.id, order.customerId));
    });
  }

  return (
    <Panel title="Chứng từ" bodyClassName="space-y-5">
      <FormMessage result={result} />
      {closed && <p className="text-sm text-muted">Đơn hàng đã hủy: không lập thêm chứng từ.</p>}

      <section aria-labelledby="paper-basis" className="space-y-2">
        <h3 id="paper-basis" className="flex items-center gap-2 text-sm font-semibold text-ink">
          <FileSignature className="size-4 text-brand-700" strokeWidth={1.75} aria-hidden />
          Hợp đồng
        </h3>
        {basis ? (
          <PaperRow paper={basis} frameworks={frameworks} />
        ) : (
          !closed && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md border border-line p-3">
                <p className="text-sm font-medium text-ink">Hợp đồng mua bán</p>
                <p className="mt-1 text-xs text-muted">
                  Hàng hóa và đơn giá của đơn hàng nằm trong hợp đồng; thanh toán theo đợt.
                </p>
                <Button
                  size="sm"
                  className="mt-3"
                  disabled={pending}
                  onClick={() => create("SALE_CONTRACT")}
                >
                  <FilePlus2 className="size-4" strokeWidth={1.75} aria-hidden />
                  Tạo hợp đồng mua bán
                </Button>
              </div>
              <div className="rounded-md border border-line p-3">
                <p className="text-sm font-medium text-ink">Theo hợp đồng nguyên tắc</p>
                <p className="mt-1 text-xs text-muted">
                  Đơn hàng thành một phụ lục của hợp đồng nguyên tắc với khách hàng.
                </p>
                {frameworks.length > 0 ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <label htmlFor="frameworkId" className="sr-only">
                      Hợp đồng nguyên tắc
                    </label>
                    <Select
                      id="frameworkId"
                      value={frameworkId}
                      onChange={(event) => setFrameworkId(event.target.value)}
                      className="h-10 w-auto min-w-56 text-sm"
                    >
                      {frameworks.map((framework) => (
                        <option key={framework.id} value={framework.id}>
                          {framework.number}
                          {framework.validUntil ? ` · đến ${formatDay(framework.validUntil)}` : ""}
                        </option>
                      ))}
                    </Select>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={pending || !frameworkId}
                      onClick={() => create("ANNEX", frameworkId)}
                    >
                      Tạo phụ lục
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3"
                    disabled={pending}
                    onClick={createFramework}
                  >
                    Tạo HĐ nguyên tắc và phụ lục
                  </Button>
                )}
              </div>
            </div>
          )
        )}
      </section>

      <PaperGroup
        id="paper-payments"
        title="Đề nghị thanh toán"
        icon={<ReceiptText className="size-4 text-brand-700" strokeWidth={1.75} aria-hidden />}
        papers={requests}
        frameworks={frameworks}
        emptyText="Chưa có đề nghị thanh toán."
        action={
          !closed && (
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => create("PAYMENT_REQUEST")}
            >
              <FilePlus2 className="size-4" strokeWidth={1.75} aria-hidden />
              Lập đề nghị thanh toán
            </Button>
          )
        }
        hint={
          basis?.kind === "SALE_CONTRACT"
            ? "Số tiền điền sẵn theo đợt thanh toán tiếp theo của hợp đồng."
            : "Số tiền điền sẵn là số khách còn phải trả."
        }
      />

      <PaperGroup
        id="paper-deliveries"
        title="Biên bản giao hàng"
        icon={<Truck className="size-4 text-brand-700" strokeWidth={1.75} aria-hidden />}
        papers={notes}
        frameworks={frameworks}
        emptyText="Chưa có biên bản giao hàng."
        action={
          !closed && (
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => create("DELIVERY_NOTE")}
            >
              <FilePlus2 className="size-4" strokeWidth={1.75} aria-hidden />
              Lập biên bản giao hàng
            </Button>
          )
        }
        hint="Giao từng phần: biên bản sau điền sẵn số lượng còn lại."
      />
    </Panel>
  );
}

function PaperGroup({
  id,
  title,
  icon,
  papers,
  frameworks,
  emptyText,
  action,
  hint,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  papers: Paper[];
  frameworks: Paper[];
  emptyText: string;
  action: React.ReactNode;
  hint: string;
}) {
  return (
    <section aria-labelledby={id} className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={id} className="flex items-center gap-2 text-sm font-semibold text-ink">
          {icon}
          {title}
        </h3>
        {action}
      </div>
      {papers.length > 0 ? (
        <ul className="space-y-2">
          {papers.map((paper) => (
            <li key={paper.id}>
              <PaperRow paper={paper} frameworks={frameworks} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          {emptyText} {hint}
        </p>
      )}
    </section>
  );
}

/** One document as a link: what it is, its number and the figure that matters for it. */
export function PaperRow({ paper, frameworks }: { paper: Paper; frameworks: Paper[] }) {
  const parent = paper.parentId
    ? frameworks.find((framework) => framework.id === paper.parentId)
    : null;
  return (
    <Link
      href={internalRoutes.paper(paper.id)}
      className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line px-3 py-2 hover:border-action-500 hover:bg-action-50/40"
    >
      <span className="min-w-0">
        <span className="block text-sm text-ink">
          {paper.label}{" "}
          <span className="font-mono font-semibold">
            {paper.kind === "ANNEX" ? `số ${paper.number}` : paper.number}
          </span>
          {parent && (
            <span className="text-muted">
              {" "}
              · HĐNT <span className="font-mono">{parent.number}</span>
            </span>
          )}
        </span>
        <span className="block text-xs text-muted">
          {paper.issuedOn ? `Ngày ${formatDay(paper.issuedOn)}` : "Chưa ghi ngày ký"}
          {paper.purpose ? ` · ${paper.purpose}` : ""}
        </span>
      </span>
      {paper.amount !== null && (
        <span className="font-mono text-sm font-semibold text-ink">{formatVnd(paper.amount)}</span>
      )}
    </Link>
  );
}
