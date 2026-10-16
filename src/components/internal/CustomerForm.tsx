"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { saveCustomerAction } from "@/app/(internal)/noi-bo/(app)/khach-hang/actions";
import { FormMessage } from "@/components/internal/FormMessage";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import type { ActionResult } from "@/lib/internal/action-result";
import { internalRoutes } from "@/lib/internal/routes";
import type { Contact, Customer } from "@/lib/internal/types";

interface ContactRow {
  name: string;
  title: string;
  phone: string;
  email: string;
}

export interface CustomerDraft {
  companyName?: string;
  taxCode?: string;
  taxAddress?: string;
  contacts?: Partial<ContactRow>[];
}

const emptyContact: ContactRow = { name: "", title: "", phone: "", email: "" };

function toRow(contact: Partial<Contact> | Partial<ContactRow>): ContactRow {
  return {
    name: contact.name ?? "",
    title: contact.title ?? "",
    phone: contact.phone ?? "",
    email: contact.email ?? "",
  };
}

/**
 * The customer record. Everything is typed in by hand (decision Q4: no tax code lookup). Used for creating and for
 * editing; `afterSave` lets the "create from a website request" flow go back to the request instead of the profile.
 */
export function CustomerForm({
  customer,
  draft,
  afterSave,
}: {
  customer?: Customer;
  draft?: CustomerDraft;
  afterSave?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<{ id: string }> | null>(null);
  const [saved, setSaved] = useState(false);
  const [fields, setFields] = useState({
    companyName: customer?.companyName ?? draft?.companyName ?? "",
    taxCode: customer?.taxCode ?? draft?.taxCode ?? "",
    taxAddress: customer?.taxAddress ?? draft?.taxAddress ?? "",
    representative: customer?.representative ?? "",
    representativeTitle: customer?.representativeTitle ?? "",
    representativeSalutation: customer?.representativeSalutation ?? "",
    shortCode: customer?.shortCode ?? "",
    phone: customer?.phone ?? "",
    bankAccount: customer?.bankAccount ?? "",
    industry: customer?.industry ?? "",
    note: customer?.note ?? "",
    active: customer?.active ?? true,
  });
  const [contacts, setContacts] = useState<ContactRow[]>(() => {
    const initial = (customer?.contacts ?? draft?.contacts ?? []).map(toRow);
    return initial.length > 0 ? initial : [{ ...emptyContact }];
  });

  function set<K extends keyof typeof fields>(key: K, value: (typeof fields)[K]) {
    setFields((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function setContact(index: number, key: keyof ContactRow, value: string) {
    setContacts((current) =>
      current.map((contact, position) =>
        position === index ? { ...contact, [key]: value } : contact,
      ),
    );
    setSaved(false);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const response = await saveCustomerAction(customer?.id ?? null, {
        ...fields,
        version: customer?.version,
        contacts,
      });
      setResult(response);
      if (!response.ok) return;
      if (customer) {
        // Stay on the profile; the refresh brings the new version, so the next save does not conflict.
        setSaved(true);
        startTransition(() => router.refresh());
      } else {
        router.push(afterSave ?? internalRoutes.customer(response.data.id));
      }
    });
  }

  const taxCodeTaken = result && !result.ok && result.code === "sales.customer.tax-code-exists";

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <Field id="companyName" label="Tên công ty" required className="md:col-span-2">
          <Input
            id="companyName"
            value={fields.companyName}
            onChange={(event) => set("companyName", event.target.value)}
            maxLength={200}
            required
            autoFocus={!customer}
          />
        </Field>
        <Field
          id="taxCode"
          label="Mã số thuế"
          hint="10 chữ số, có thể thêm -NNN. Để trống với khách cá nhân."
        >
          <Input
            id="taxCode"
            value={fields.taxCode}
            onChange={(event) => set("taxCode", event.target.value)}
            inputMode="numeric"
            className="font-mono"
            maxLength={14}
          />
        </Field>
        <Field id="industry" label="Ngành nghề">
          <Input
            id="industry"
            value={fields.industry}
            onChange={(event) => set("industry", event.target.value)}
            maxLength={100}
          />
        </Field>
        <Field id="taxAddress" label="Địa chỉ thuế" className="md:col-span-2">
          <Input
            id="taxAddress"
            value={fields.taxAddress}
            onChange={(event) => set("taxAddress", event.target.value)}
            maxLength={300}
          />
        </Field>
        <Field id="representative" label="Người đại diện">
          <Input
            id="representative"
            value={fields.representative}
            onChange={(event) => set("representative", event.target.value)}
            maxLength={100}
          />
        </Field>
        <div className="grid grid-cols-[7rem_1fr] gap-3">
          <Field id="representativeSalutation" label="Danh xưng">
            <Select
              id="representativeSalutation"
              value={fields.representativeSalutation}
              onChange={(event) => set("representativeSalutation", event.target.value)}
            >
              <option value="">—</option>
              <option value="Ông">Ông</option>
              <option value="Bà">Bà</option>
            </Select>
          </Field>
          <Field id="representativeTitle" label="Chức vụ người đại diện">
            <Input
              id="representativeTitle"
              value={fields.representativeTitle}
              onChange={(event) => set("representativeTitle", event.target.value)}
              placeholder="VD: Giám đốc"
              maxLength={100}
            />
          </Field>
        </div>
      </div>

      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-2 text-sm font-medium text-ink">Thông tin cho hợp đồng</legend>
        <Field
          id="shortCode"
          label="Mã viết tắt"
          hint="Dùng trong số hợp đồng, ví dụ LOTTE → 01.2026/LOTTE-KL/HĐMB."
        >
          <Input
            id="shortCode"
            value={fields.shortCode}
            onChange={(event) => set("shortCode", event.target.value.toUpperCase())}
            maxLength={15}
            className="font-mono uppercase"
          />
        </Field>
        <Field id="phone" label="Điện thoại công ty">
          <Input
            id="phone"
            value={fields.phone}
            onChange={(event) => set("phone", event.target.value)}
            inputMode="tel"
            maxLength={60}
          />
        </Field>
        <Field
          id="bankAccount"
          label="Tài khoản ngân hàng"
          hint="Số tài khoản và ngân hàng, như in trên hợp đồng."
          className="md:col-span-2"
        >
          <Input
            id="bankAccount"
            value={fields.bankAccount}
            onChange={(event) => set("bankAccount", event.target.value)}
            placeholder="VD: 0071000123456 tại Vietcombank – CN Bình Dương"
            maxLength={300}
          />
        </Field>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-ink">Người liên hệ</legend>
        <p className="mt-0.5 text-xs text-muted">Người đầu tiên được điền sẵn vào báo giá.</p>
        <div className="mt-2 space-y-2">
          {contacts.map((contact, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-md border border-line bg-surface p-2 sm:grid-cols-[1.2fr_1fr_1fr_1.3fr_auto]"
            >
              <Input
                aria-label={`Tên người liên hệ ${index + 1}`}
                placeholder="Họ tên"
                value={contact.name}
                onChange={(event) => setContact(index, "name", event.target.value)}
                maxLength={100}
              />
              <Input
                aria-label={`Chức vụ người liên hệ ${index + 1}`}
                placeholder="Chức vụ"
                value={contact.title}
                onChange={(event) => setContact(index, "title", event.target.value)}
                maxLength={100}
              />
              <Input
                aria-label={`Số điện thoại người liên hệ ${index + 1}`}
                placeholder="Số điện thoại"
                value={contact.phone}
                onChange={(event) => setContact(index, "phone", event.target.value)}
                inputMode="tel"
                maxLength={30}
              />
              <Input
                aria-label={`Email người liên hệ ${index + 1}`}
                placeholder="Email"
                type="email"
                value={contact.email}
                onChange={(event) => setContact(index, "email", event.target.value)}
                maxLength={254}
              />
              <button
                type="button"
                onClick={() => {
                  setContacts((current) =>
                    current.length > 1
                      ? current.filter((_, position) => position !== index)
                      : [{ ...emptyContact }],
                  );
                  setSaved(false);
                }}
                className="inline-flex size-10 items-center justify-center rounded-md text-muted hover:bg-danger-soft hover:text-danger"
                aria-label={`Xóa người liên hệ ${index + 1}`}
              >
                <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
              </button>
            </div>
          ))}
        </div>
        {contacts.length < 20 && (
          <button
            type="button"
            onClick={() => setContacts((current) => [...current, { ...emptyContact }])}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-action-600 hover:text-action-700"
          >
            <Plus className="size-4" strokeWidth={2} aria-hidden />
            Thêm người liên hệ
          </button>
        )}
      </fieldset>

      <Field id="note" label="Ghi chú">
        <Textarea
          id="note"
          value={fields.note}
          onChange={(event) => set("note", event.target.value)}
          maxLength={2000}
        />
      </Field>

      {customer && (
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={fields.active}
            onChange={(event) => set("active", event.target.checked)}
            className="size-4 accent-action-600"
          />
          Đang giao dịch
          <span className="text-muted">
            — bỏ chọn để ngừng dùng khách hàng này (hồ sơ và chứng từ vẫn giữ)
          </span>
        </label>
      )}

      <FormMessage result={result} />
      {taxCodeTaken && (
        <p className="text-sm">
          <Link
            href={`${internalRoutes.customers}?q=${encodeURIComponent(fields.taxCode)}&ngung=1`}
            className="font-medium text-action-600 underline underline-offset-2"
          >
            Mở hồ sơ khách hàng đã có MST này
          </Link>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Đang lưu…" : customer ? "Lưu thay đổi" : "Tạo khách hàng"}
        </Button>
        {saved && !pending && (
          <span role="status" className="text-sm text-success">
            Đã lưu.
          </span>
        )}
      </div>
    </form>
  );
}
