"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Download, FileText, FileType2, Plus, Save, Trash2 } from "lucide-react";
import {
  deletePaperAction,
  exportPaperAction,
  savePaperAction,
} from "@/app/(internal)/noi-bo/(app)/chung-tu/actions";
import { FormMessage } from "@/components/internal/FormMessage";
import { Panel } from "@/components/internal/PageHeader";
import { PaperSectionsEditor, PlaceholderHelp } from "@/components/internal/PaperSectionsEditor";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import type { ActionResult } from "@/lib/internal/action-result";
import { formatFileSize, formatInstant, formatNumber } from "@/lib/internal/format";
import { isSaleContract } from "@/lib/internal/paper-rules";
import { parseAmount } from "@/lib/internal/pricing";
import { internalRoutes } from "@/lib/internal/routes";
import type {
  Paper,
  PaperDelivery,
  PaperFile,
  PaperFormat,
  PaperInstallment,
  PaperParty,
  PaperPlaceholder,
  PaperSection,
} from "@/lib/internal/types";

interface FormState {
  number: string;
  issuedOn: string;
  validUntil: string;
  creditLimit: string;
  paymentDays: string;
  amount: string;
  purpose: string;
  buyer: PaperParty;
  seller: PaperParty;
  sections: PaperSection[];
  installments: PaperInstallment[];
  delivery: PaperDelivery | null;
}

function initialForm(paper: Paper): FormState {
  return {
    number: paper.number,
    issuedOn: paper.issuedOn ?? "",
    validUntil: paper.validUntil ?? "",
    creditLimit: paper.creditLimit === null ? "" : formatNumber(paper.creditLimit),
    paymentDays: paper.paymentDays === null ? "" : String(paper.paymentDays),
    amount: paper.amount === null ? "" : formatNumber(paper.amount),
    purpose: paper.purpose ?? "",
    buyer: paper.buyer,
    seller: paper.seller,
    sections: paper.sections,
    installments: paper.installments,
    delivery: paper.delivery,
  };
}

/**
 * Checks and edits a contract, annex, payment request or delivery note, then exports it. The figures of the items
 * table and the amounts in words are filled in from the order when the file is made, so they always match it; the
 * text around them is free. Every export is kept, exactly as it was downloaded.
 */
export function PaperEditor({
  paper,
  files,
  placeholders,
  backHref,
}: {
  paper: Paper;
  files: PaperFile[];
  placeholders: PaperPlaceholder[];
  /** Where to go after deleting: the order, or the customer of a framework contract. */
  backHref: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(() => initialForm(paper));
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<ActionResult<unknown> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function change<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }

  function amountField(key: "creditLimit" | "amount", value: string) {
    const parsed = parseAmount(value);
    change(key, parsed === null ? "" : formatNumber(parsed));
  }

  function save() {
    startTransition(async () => {
      const response = await savePaperAction(paper.id, {
        version: paper.version,
        number: form.number,
        issuedOn: form.issuedOn || null,
        buyer: form.buyer,
        seller: form.seller,
        validUntil: form.validUntil || null,
        creditLimit: parseAmount(form.creditLimit),
        paymentDays: form.paymentDays ? Number(form.paymentDays) : null,
        amount: parseAmount(form.amount),
        purpose: form.purpose,
        sections: form.sections,
        installments: form.installments,
        delivery: form.delivery,
      });
      setResult(response);
      if (!response.ok) return;
      setDirty(false);
      // Part of this transition: the next save or export sends the version the refreshed page holds.
      startTransition(() => router.refresh());
    });
  }

  function exportAs(format: PaperFormat) {
    startTransition(async () => {
      const response = await exportPaperAction(paper.id, format);
      setResult(response.ok ? null : response);
      if (!response.ok) return;
      window.location.assign(internalRoutes.paperFile(paper.id, response.data.id));
      startTransition(() => router.refresh());
    });
  }

  function remove() {
    startTransition(async () => {
      const response = await deletePaperAction(paper.id, paper.version);
      setResult(response);
      if (response.ok) router.push(backHref);
    });
  }

  const bilingual = paper.kind === "SALE_CONTRACT_BILINGUAL";
  const installmentTotal = form.installments.reduce((sum, item) => sum + (item.percent || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <Panel title="Thông tin chứng từ">
            <fieldset disabled={pending} className="grid gap-4 md:grid-cols-3">
              <Field id="number" label="Số" required>
                <Input
                  id="number"
                  value={form.number}
                  onChange={(event) => change("number", event.target.value)}
                  maxLength={60}
                  className="font-mono"
                />
              </Field>
              <Field
                id="issuedOn"
                label={
                  paper.kind === "PAYMENT_REQUEST" || paper.kind === "DELIVERY_NOTE"
                    ? "Ngày lập"
                    : paper.kind === "DEBT_RECONCILIATION"
                      ? "Ngày đối chiếu (công nợ tính đến ngày này)"
                      : "Ngày ký"
                }
                hint="Để trống: in “ngày … tháng … năm” để ghi tay."
              >
                <Input
                  id="issuedOn"
                  type="date"
                  value={form.issuedOn}
                  onChange={(event) => change("issuedOn", event.target.value)}
                />
              </Field>
              {paper.kind === "FRAMEWORK_CONTRACT" && (
                <>
                  <Field id="validUntil" label="Hiệu lực đến hết ngày">
                    <Input
                      id="validUntil"
                      type="date"
                      value={form.validUntil}
                      min={form.issuedOn || undefined}
                      onChange={(event) => change("validUntil", event.target.value)}
                    />
                  </Field>
                  <Field id="creditLimit" label="Hạn mức công nợ (₫)">
                    <Input
                      id="creditLimit"
                      value={form.creditLimit}
                      inputMode="numeric"
                      onChange={(event) => amountField("creditLimit", event.target.value)}
                      className="text-right font-mono"
                    />
                  </Field>
                  <Field id="paymentDays" label="Thanh toán trong (ngày)">
                    <Input
                      id="paymentDays"
                      value={form.paymentDays}
                      inputMode="numeric"
                      maxLength={3}
                      onChange={(event) =>
                        change("paymentDays", event.target.value.replace(/\D/g, ""))
                      }
                      className="text-right font-mono"
                    />
                  </Field>
                </>
              )}
              {paper.kind === "PAYMENT_REQUEST" && (
                <>
                  <Field id="amount" label="Số tiền đề nghị (₫)" required>
                    <Input
                      id="amount"
                      value={form.amount}
                      inputMode="numeric"
                      onChange={(event) => amountField("amount", event.target.value)}
                      className="text-right font-mono font-semibold"
                    />
                  </Field>
                  <Field id="purpose" label="Nội dung thanh toán" className="md:col-span-2">
                    <Input
                      id="purpose"
                      value={form.purpose}
                      maxLength={300}
                      onChange={(event) => change("purpose", event.target.value)}
                      placeholder="VD: đợt 1 (50% giá trị hợp đồng)"
                    />
                  </Field>
                </>
              )}
            </fieldset>
          </Panel>

          {isSaleContract(paper.kind) && (
            <Panel
              title="Các đợt thanh toán"
              actions={
                <span
                  className={`text-sm font-medium ${installmentTotal === 100 ? "text-success" : "text-danger"}`}
                >
                  Tổng {installmentTotal}%
                </span>
              }
            >
              <fieldset disabled={pending} className="space-y-2">
                {form.installments.map((installment, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-2">
                    {/* The English wording of a bilingual contract sits under the Vietnamese one. */}
                    <span className="w-14 text-sm text-muted">Đợt {index + 1}</span>
                    <label className="sr-only" htmlFor={`installment-percent-${index}`}>
                      Phần trăm đợt {index + 1}
                    </label>
                    <Input
                      id={`installment-percent-${index}`}
                      value={installment.percent ? String(installment.percent) : ""}
                      inputMode="numeric"
                      maxLength={3}
                      onChange={(event) =>
                        change(
                          "installments",
                          form.installments.map((item, position) =>
                            position === index
                              ? {
                                  ...item,
                                  percent: Number(event.target.value.replace(/\D/g, "")) || 0,
                                }
                              : item,
                          ),
                        )
                      }
                      className="h-10 w-20 text-right font-mono"
                    />
                    <span className="text-sm text-muted">%</span>
                    <label className="sr-only" htmlFor={`installment-condition-${index}`}>
                      Thời hạn đợt {index + 1}
                    </label>
                    <Input
                      id={`installment-condition-${index}`}
                      value={installment.condition}
                      maxLength={500}
                      onChange={(event) =>
                        change(
                          "installments",
                          form.installments.map((item, position) =>
                            position === index ? { ...item, condition: event.target.value } : item,
                          ),
                        )
                      }
                      placeholder="VD: trong vòng 03 ngày làm việc kể từ ngày ký hợp đồng"
                      className="h-10 min-w-64 flex-1 text-sm"
                    />
                    <button
                      type="button"
                      aria-label={`Xóa đợt ${index + 1}`}
                      onClick={() =>
                        change(
                          "installments",
                          form.installments.filter((_, position) => position !== index),
                        )
                      }
                      className="inline-flex size-9 items-center justify-center rounded text-muted hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
                    </button>
                    {bilingual && (
                      <>
                        <label className="sr-only" htmlFor={`installment-condition-en-${index}`}>
                          Thời hạn đợt {index + 1} bằng tiếng Anh
                        </label>
                        <Input
                          id={`installment-condition-en-${index}`}
                          value={installment.conditionEn ?? ""}
                          maxLength={500}
                          onChange={(event) =>
                            change(
                              "installments",
                              form.installments.map((item, position) =>
                                position === index
                                  ? { ...item, conditionEn: event.target.value || null }
                                  : item,
                              ),
                            )
                          }
                          placeholder="EN: within 03 working days from the date both Parties sign the Contract"
                          className="ml-[8.5rem] h-10 min-w-64 flex-1 text-sm italic"
                        />
                      </>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    change("installments", [
                      ...form.installments,
                      {
                        percent: Math.max(0, 100 - installmentTotal),
                        condition: "",
                        conditionEn: null,
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-action-600 hover:text-action-700"
                >
                  <Plus className="size-4" strokeWidth={2} aria-hidden />
                  Thêm đợt
                </button>
                <p className="text-xs text-muted">
                  Số tiền từng đợt được tính từ tổng giá trị đơn hàng khi xuất file (đợt cuối nhận
                  phần lẻ).
                </p>
              </fieldset>
            </Panel>
          )}

          {paper.kind === "DELIVERY_NOTE" && form.delivery && (
            <DeliveryFields
              delivery={form.delivery}
              disabled={pending}
              onChange={(delivery) => change("delivery", delivery)}
            />
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            <PartyFields
              title="Bên mua (khách hàng)"
              prefix="buyer"
              party={form.buyer}
              bilingual={bilingual}
              disabled={pending}
              onChange={(party) => change("buyer", party)}
            />
            <PartyFields
              title="Bên bán (Kim Long)"
              prefix="seller"
              party={form.seller}
              bilingual={bilingual}
              disabled={pending}
              onChange={(party) => change("seller", party)}
            />
          </div>

          <Panel title="Nội dung">
            <PaperSectionsEditor
              sections={form.sections}
              placeholders={placeholders}
              bilingual={bilingual}
              disabled={pending}
              onChange={(sections) => change("sections", sections)}
            />
          </Panel>
        </div>

        <aside className="space-y-4">
          <Panel title="Xuất file" bodyClassName="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={pending || dirty}
                onClick={() => exportAs("DOCX")}
              >
                <FileType2 className="size-4" strokeWidth={1.75} aria-hidden />
                Xuất Word
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={pending || dirty}
                onClick={() => exportAs("PDF")}
              >
                <FileText className="size-4" strokeWidth={1.75} aria-hidden />
                Xuất PDF
              </Button>
            </div>
            <p className="text-xs text-muted">
              {dirty
                ? "Lưu thay đổi trước khi xuất file."
                : "Word để chỉnh tiếp, PDF để gửi khách. Không có giá vốn, hoa hồng hay chi phí trong file."}
            </p>
            {files.length > 0 && (
              <ul className="divide-y divide-line rounded-md border border-line">
                {files.map((file) => (
                  <li key={file.id} className="flex items-center justify-between gap-2 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs text-ink">{file.filename}</p>
                      <p className="text-xs text-muted">
                        {formatInstant(file.createdAt)} · {formatFileSize(file.sizeBytes)}
                      </p>
                    </div>
                    <a
                      href={internalRoutes.paperFile(paper.id, file.id)}
                      aria-label={`Tải ${file.filename}`}
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded text-action-600 hover:bg-action-50"
                    >
                      <Download className="size-4" strokeWidth={1.75} aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Cách soạn">
            <PlaceholderHelp placeholders={placeholders} />
          </Panel>
        </aside>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <Button size="sm" onClick={save} disabled={pending || !dirty}>
          <Save className="size-4" strokeWidth={1.75} aria-hidden />
          {pending ? "Đang lưu…" : "Lưu chứng từ"}
        </Button>
        {dirty && !pending && <span className="text-sm text-muted">Có thay đổi chưa lưu</span>}
        <span className="ml-auto" />
        {confirmDelete ? (
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-danger">Xóa chứng từ này và các file đã xuất?</span>
            <Button size="sm" variant="danger" disabled={pending} onClick={remove}>
              Xóa
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => setConfirmDelete(false)}
            >
              Thôi
            </Button>
          </span>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
            Xóa chứng từ
          </Button>
        )}
        <FormMessage result={result} className="basis-full" />
      </div>
    </div>
  );
}

function PartyFields({
  title,
  prefix,
  party,
  disabled,
  onChange,
  bilingual = false,
}: {
  title: string;
  prefix: string;
  party: PaperParty;
  disabled: boolean;
  onChange: (party: PaperParty) => void;
  bilingual?: boolean;
}) {
  const text = (key: keyof PaperParty, label: string, max: number, className?: string) => (
    <Field id={`${prefix}-${key}`} label={label} className={className}>
      <Input
        id={`${prefix}-${key}`}
        value={party[key] ?? ""}
        maxLength={max}
        onChange={(event) =>
          onChange({
            ...party,
            [key]: key === "name" ? event.target.value : event.target.value || null,
          })
        }
      />
    </Field>
  );
  return (
    <Panel title={title}>
      <fieldset disabled={disabled} className="grid gap-3 md:grid-cols-2">
        {text("name", "Tên công ty", 200, "md:col-span-2")}
        {text("address", "Địa chỉ", 300, "md:col-span-2")}
        {text("taxCode", "Mã số thuế", 20)}
        {text("phone", "Điện thoại", 60)}
        {text("bankAccount", "Tài khoản ngân hàng", 300, "md:col-span-2")}
        {text("representative", "Người đại diện", 100)}
        <Field id={`${prefix}-salutation`} label="Danh xưng">
          <Select
            id={`${prefix}-salutation`}
            value={party.salutation ?? ""}
            onChange={(event) => onChange({ ...party, salutation: event.target.value || null })}
          >
            <option value="">—</option>
            <option value="Ông">Ông</option>
            <option value="Bà">Bà</option>
          </Select>
        </Field>
        {text("representativeTitle", "Chức vụ", 100)}
        {text("email", "Email", 254)}
        {bilingual && (
          <>
            <p className="pt-2 text-xs font-semibold tracking-wide text-muted uppercase md:col-span-2">
              Tiếng Anh (in dưới phần tiếng Việt)
            </p>
            {text("nameEn", "Tên công ty (tiếng Anh)", 200, "md:col-span-2")}
            {text("addressEn", "Địa chỉ (tiếng Anh)", 300, "md:col-span-2")}
            {text("representativeTitleEn", "Chức vụ (tiếng Anh)", 100)}
          </>
        )}
      </fieldset>
    </Panel>
  );
}

function DeliveryFields({
  delivery,
  disabled,
  onChange,
}: {
  delivery: PaperDelivery;
  disabled: boolean;
  onChange: (delivery: PaperDelivery) => void;
}) {
  const text = (
    key: "deliveredBy" | "receiverName" | "receiverTitle" | "contact" | "address",
    label: string,
  ) => (
    <Field id={`delivery-${key}`} label={label}>
      <Input
        id={`delivery-${key}`}
        value={delivery[key] ?? ""}
        maxLength={key === "address" ? 300 : 200}
        onChange={(event) => onChange({ ...delivery, [key]: event.target.value || null })}
      />
    </Field>
  );
  return (
    <Panel title="Giao nhận">
      <fieldset disabled={disabled} className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          {text("deliveredBy", "Người giao hàng")}
          {text("contact", "Người liên hệ bên nhận")}
          {text("receiverName", "Người nhận hàng (để trống để ghi tay)")}
          {text("receiverTitle", "Chức vụ người nhận")}
          {text("address", "Địa chỉ giao (để trống: địa chỉ khách hàng)")}
        </div>
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface text-left text-xs font-medium text-muted">
                <th className="px-2 py-2">#</th>
                <th className="px-2 py-2">Hàng hóa</th>
                <th className="px-2 py-2 text-right">SL đặt</th>
                <th className="w-24 px-2 py-2 text-right">SL giao</th>
                <th className="px-2 py-2">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {delivery.lines.map((line, index) => (
                <tr key={index} className="border-b border-line last:border-b-0">
                  <td className="px-2 font-mono text-xs text-muted">{index + 1}</td>
                  <td className="px-2 py-1.5">
                    <span className="font-mono font-semibold text-ink">{line.partNumber}</span>
                    {line.name && <span className="block text-xs text-muted">{line.name}</span>}
                  </td>
                  <td className="px-2 text-right font-mono">{formatNumber(line.ordered)}</td>
                  <td className="px-1">
                    <label className="sr-only" htmlFor={`delivered-${index}`}>
                      Số lượng giao dòng {index + 1}
                    </label>
                    <Input
                      id={`delivered-${index}`}
                      value={String(line.delivered)}
                      inputMode="numeric"
                      onChange={(event) =>
                        onChange({
                          ...delivery,
                          lines: delivery.lines.map((item, position) =>
                            position === index
                              ? {
                                  ...item,
                                  delivered: Number(event.target.value.replace(/\D/g, "")) || 0,
                                }
                              : item,
                          ),
                        })
                      }
                      className="h-9 text-right font-mono"
                    />
                  </td>
                  <td className="px-1">
                    <label className="sr-only" htmlFor={`delivery-note-${index}`}>
                      Ghi chú dòng {index + 1}
                    </label>
                    <Input
                      id={`delivery-note-${index}`}
                      value={line.note ?? ""}
                      maxLength={500}
                      onChange={(event) =>
                        onChange({
                          ...delivery,
                          lines: delivery.lines.map((item, position) =>
                            position === index
                              ? { ...item, note: event.target.value || null }
                              : item,
                          ),
                        })
                      }
                      className="h-9 text-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>
    </Panel>
  );
}
