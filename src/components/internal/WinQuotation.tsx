"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trophy } from "lucide-react";
import { winQuotationAction } from "@/app/(internal)/noi-bo/(app)/don-hang/actions";
import { FormMessage } from "@/components/internal/FormMessage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import type { ActionResult } from "@/lib/internal/action-result";
import { internalRoutes } from "@/lib/internal/routes";
import type { Quotation } from "@/lib/internal/types";

/**
 * The "THẮNG" button. One click turns the quotation into an order with all its lines and its VAT rate — nothing is
 * typed again. The button is disabled while the request runs, and the platform refuses a second order for the same
 * quotation anyway.
 */
export function WinQuotation({ quotation, today }: { quotation: Quotation; today: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [orderDate, setOrderDate] = useState(today);
  const [note, setNote] = useState("");
  const [result, setResult] = useState<ActionResult<{ id: string }> | null>(null);

  if (quotation.status !== "WAITING" && quotation.status !== "NEGOTIATING") return null;

  function win() {
    startTransition(async () => {
      const response = await winQuotationAction(quotation.id, quotation.version, orderDate, note);
      setResult(response);
      if (response.ok) router.push(internalRoutes.order(response.data.id));
    });
  }

  if (!open) {
    return (
      <Button size="sm" variant="accent" onClick={() => setOpen(true)}>
        <Trophy className="size-4" strokeWidth={1.75} aria-hidden />
        THẮNG — chốt đơn hàng
      </Button>
    );
  }

  return (
    <div className="w-full space-y-3 rounded-md border border-brand-300 bg-brand-50 p-3">
      <p className="text-sm text-ink">
        Báo giá <span className="font-mono font-semibold">{quotation.number}</span> sẽ chuyển sang{" "}
        <span className="font-semibold">Đã chốt</span> và một đơn hàng được tạo với toàn bộ dòng
        hàng, đơn giá và thuế suất của báo giá (theo bản đã lưu).
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <label>
          <span className="mb-1 block text-xs font-medium text-brand-800">Ngày đặt hàng</span>
          <Input
            type="date"
            value={orderDate}
            onChange={(event) => setOrderDate(event.target.value)}
            className="w-44"
          />
        </label>
        <label className="min-w-56 flex-1">
          <span className="mb-1 block text-xs font-medium text-brand-800">
            Ghi chú đơn hàng (không bắt buộc)
          </span>
          <Input value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} />
        </label>
        <Button size="sm" variant="accent" disabled={pending} onClick={win}>
          <Trophy className="size-4" strokeWidth={1.75} aria-hidden />
          {pending ? "Đang chốt…" : "Xác nhận THẮNG"}
        </Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
          Thôi
        </Button>
      </div>
      <FormMessage result={result} />
    </div>
  );
}
