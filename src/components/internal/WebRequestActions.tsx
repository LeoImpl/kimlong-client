"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FilePlus2, Hand, UserPlus } from "lucide-react";
import {
  claimWebRequestAction,
  createQuotationFromWebRequestAction,
} from "@/app/(internal)/noi-bo/(app)/yeu-cau-web/actions";
import { CustomerPicker } from "@/components/internal/CustomerPicker";
import { FormMessage } from "@/components/internal/FormMessage";
import { Button, ButtonLink } from "@/components/ui/Button";
import type { ActionResult } from "@/lib/internal/action-result";
import { internalRoutes } from "@/lib/internal/routes";
import type { Customer, WebRequestDetail } from "@/lib/internal/types";

/**
 * Take a website request, then turn it into a draft quotation without retyping its lines. The quotation goes to
 * the salesperson's customer with the same tax code; when there is none, they create the customer from the
 * request (the form comes prefilled) or pick another of their customers.
 */
export function WebRequestActions({ request }: { request: WebRequestDetail }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<unknown> | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);

  if (request.quotation) {
    return (
      <ButtonLink href={internalRoutes.quotation(request.quotation.id)} size="sm">
        Mở báo giá {request.quotation.number}
      </ButtonLink>
    );
  }
  if (!request.open) return <p className="text-sm text-muted">Yêu cầu này đã đóng.</p>;

  if (request.access === "FREE") {
    return (
      <div className="space-y-2">
        <Button
          size="sm"
          variant="dark"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const response = await claimWebRequestAction(request.id);
              setResult(response);
              // Also refreshed after a refusal: someone else took it a moment ago, and the page should say who.
              startTransition(() => router.refresh());
            })
          }
        >
          <Hand className="size-4" strokeWidth={1.75} aria-hidden />
          {pending ? "Đang nhận…" : "Nhận yêu cầu này"}
        </Button>
        <p className="text-xs text-muted">
          Sau khi bạn nhận, nhân viên khác vẫn thấy yêu cầu trong danh sách nhưng không mở được.
        </p>
        <FormMessage result={result} />
      </div>
    );
  }
  if (request.access !== "MINE") {
    return (
      <p className="text-sm text-muted">
        Yêu cầu do {request.assignee?.name ?? "nhân viên khác"} phụ trách. Chỉ người nhận tạo được
        báo giá.
      </p>
    );
  }

  function createQuotation(customerId?: string) {
    startTransition(async () => {
      const response = await createQuotationFromWebRequestAction(request.id, customerId);
      setResult(response);
      if (response.ok) router.push(internalRoutes.quotation(response.data.id));
    });
  }

  if (request.matchingCustomerId) {
    return (
      <div className="space-y-2">
        <Button size="sm" disabled={pending} onClick={() => createQuotation()}>
          <FilePlus2 className="size-4" strokeWidth={1.75} aria-hidden />
          {pending ? "Đang tạo…" : "Tạo báo giá từ yêu cầu này"}
        </Button>
        <p className="text-xs text-muted">
          Báo giá nháp được lập cho{" "}
          <Link
            href={internalRoutes.customer(request.matchingCustomerId)}
            className="font-medium text-action-600 hover:underline"
          >
            khách hàng của bạn có cùng MST
          </Link>
          , với đủ các dòng khách yêu cầu. Bạn chỉ cần điền giá.
        </p>
        <FormMessage result={result} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-body">
        Chưa có khách hàng nào của bạn trùng MST với yêu cầu này. Tạo khách hàng từ thông tin người
        gửi, hoặc chọn một khách hàng sẵn có.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <ButtonLink href={`${internalRoutes.newCustomer}?tu-yeu-cau=${request.id}`} size="sm">
          <UserPlus className="size-4" strokeWidth={1.75} aria-hidden />
          Tạo khách hàng từ yêu cầu
        </ButtonLink>
      </div>
      <div className="max-w-xl space-y-2">
        <CustomerPicker selected={customer} onSelect={setCustomer} />
        {customer && (
          <Button size="sm" disabled={pending} onClick={() => createQuotation(customer.id)}>
            <FilePlus2 className="size-4" strokeWidth={1.75} aria-hidden />
            {pending ? "Đang tạo…" : "Tạo báo giá cho khách hàng này"}
          </Button>
        )}
      </div>
      <FormMessage result={result} />
    </div>
  );
}
