"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Copy, MessagesSquare, RotateCcw, Send, XCircle } from "lucide-react";
import {
  changeQuotationStatusAction,
  cloneQuotationAction,
} from "@/app/(internal)/noi-bo/(app)/bao-gia/actions";
import { FormMessage } from "@/components/internal/FormMessage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import type { ActionResult } from "@/lib/internal/action-result";
import { internalRoutes } from "@/lib/internal/routes";
import type { Quotation, QuotationStatus } from "@/lib/internal/types";

/**
 * What can be done with a quotation in its current status: mark it sent, move it between "waiting" and
 * "negotiating", lose it (with a reason), reopen it, or copy it into a new draft.
 */
export function QuotationActions({ quotation }: { quotation: Quotation }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<unknown> | null>(null);
  const [losing, setLosing] = useState(false);
  const [reason, setReason] = useState("");
  const empty = quotation.lines.length === 0;

  function move(status: QuotationStatus, why?: string) {
    startTransition(async () => {
      const response = await changeQuotationStatusAction(
        quotation.id,
        quotation.version,
        status,
        why,
      );
      setResult(response);
      if (response.ok) {
        setLosing(false);
        setReason("");
        // Inside the transition: the buttons stay disabled until the page shows the new status and version.
        startTransition(() => router.refresh());
      }
    });
  }

  function copy() {
    startTransition(async () => {
      const response = await cloneQuotationAction(quotation.id);
      setResult(response);
      if (response.ok) router.push(internalRoutes.quotation(response.data.id));
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {quotation.status === "DRAFT" && (
          <Button
            size="sm"
            variant="dark"
            disabled={pending || empty}
            title={empty ? "Thêm ít nhất một dòng hàng và lưu trước khi gửi" : undefined}
            onClick={() => move("WAITING")}
          >
            <Send className="size-4" strokeWidth={1.75} aria-hidden />
            Đánh dấu đã gửi khách
          </Button>
        )}
        {quotation.status === "WAITING" && (
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => move("NEGOTIATING")}
          >
            <MessagesSquare className="size-4" strokeWidth={1.75} aria-hidden />
            Đang thương lượng
          </Button>
        )}
        {quotation.status === "NEGOTIATING" && (
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => move("WAITING")}>
            <Send className="size-4" strokeWidth={1.75} aria-hidden />
            Đã gửi lại, chờ phản hồi
          </Button>
        )}
        {(quotation.status === "WAITING" || quotation.status === "NEGOTIATING") && !losing && (
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => setLosing(true)}>
            <XCircle className="size-4" strokeWidth={1.75} aria-hidden />
            Không thành công
          </Button>
        )}
        {quotation.status === "LOST" && (
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => move("NEGOTIATING")}
          >
            <RotateCcw className="size-4" strokeWidth={1.75} aria-hidden />
            Mở lại để thương lượng
          </Button>
        )}
        <Button size="sm" variant="ghost" disabled={pending} onClick={copy}>
          <Copy className="size-4" strokeWidth={1.75} aria-hidden />
          Tạo báo giá mới từ báo giá này
        </Button>
      </div>

      {losing && (
        <div className="flex flex-wrap items-end gap-2 rounded-md border border-danger/20 bg-danger-soft p-3">
          <label className="min-w-64 flex-1">
            <span className="mb-1 block text-xs font-medium text-danger">
              Lý do không thành công (không bắt buộc)
            </span>
            <Input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              placeholder="VD: Giá cao hơn đối thủ, khách hoãn dự án…"
              autoFocus
            />
          </label>
          <Button
            size="sm"
            variant="danger"
            disabled={pending}
            onClick={() => move("LOST", reason)}
          >
            Xác nhận
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => setLosing(false)}>
            Thôi
          </Button>
        </div>
      )}
      <FormMessage result={result} />
    </div>
  );
}
