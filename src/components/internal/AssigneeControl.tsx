"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { reassignCustomerAction } from "@/app/(internal)/noi-bo/(app)/khach-hang/actions";
import { FormMessage } from "@/components/internal/FormMessage";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import type { ActionResult } from "@/lib/internal/action-result";
import type { Customer, Staff } from "@/lib/internal/types";

/**
 * Administrators hand a customer — with its quotations, orders and figures — to another salesperson. Only shown
 * to administrators; the platform refuses the call from anyone else.
 */
export function AssigneeControl({ customer, staff }: { customer: Customer; staff: Staff[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [assignee, setAssignee] = useState(customer.assignee?.userId ?? "");
  const [result, setResult] = useState<ActionResult | null>(null);
  const changed = assignee !== (customer.assignee?.userId ?? "");
  // A salesperson who left may no longer be in the directory but is still on the record.
  const known = staff.some((member) => member.userId === customer.assignee?.userId);

  function save() {
    startTransition(async () => {
      const response = await reassignCustomerAction(
        customer.id,
        customer.version,
        assignee || null,
      );
      setResult(response);
      if (response.ok) startTransition(() => router.refresh());
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label="Nhân viên phụ trách"
          value={assignee}
          onChange={(event) => setAssignee(event.target.value)}
          className="h-10 w-auto min-w-56 text-sm"
        >
          <option value="">— Chưa có người phụ trách —</option>
          {customer.assignee && !known && (
            <option value={customer.assignee.userId}>{customer.assignee.name}</option>
          )}
          {staff.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.name}
              {member.admin ? " (quản trị)" : ""}
            </option>
          ))}
        </Select>
        <Button size="sm" variant="secondary" disabled={!changed || pending} onClick={save}>
          {pending ? "Đang chuyển…" : "Chuyển phụ trách"}
        </Button>
      </div>
      <p className="text-xs text-muted">
        Báo giá, đơn hàng và số liệu của khách hàng đi theo người phụ trách mới.
      </p>
      <FormMessage result={result} />
    </div>
  );
}
