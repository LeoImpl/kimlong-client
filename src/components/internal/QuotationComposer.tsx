"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { History, Save } from "lucide-react";
import {
  lookupProductsAction,
  saveQuotationAction,
} from "@/app/(internal)/noi-bo/(app)/bao-gia/actions";
import { CustomerPicker } from "@/components/internal/CustomerPicker";
import { FormMessage } from "@/components/internal/FormMessage";
import {
  emptyLine,
  isBlank,
  LineGrid,
  priced,
  toGridLine,
  toLineInput,
  type GridLine,
} from "@/components/internal/LineGrid";
import { Panel } from "@/components/internal/PageHeader";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Feedback";
import type { ActionResult } from "@/lib/internal/action-result";
import {
  formatInstant,
  formatNumber,
  formatPercent,
  formatVnd,
  vatRates,
} from "@/lib/internal/format";
import { percentOf, subtotal, totalProfit, vatAmount } from "@/lib/internal/pricing";
import { internalRoutes } from "@/lib/internal/routes";
import type { Customer, Quotation, SalesSettings, VatRate } from "@/lib/internal/types";

interface FormState {
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  quoteDate: string;
  validUntil: string;
  vatRate: VatRate;
  paymentTerms: string;
  deliveryTerms: string;
  warrantyTerms: string;
  note: string;
}

/** What is kept in the browser while a quotation is being written, so a closed tab loses nothing. */
interface LocalDraft {
  savedAt: string;
  /** Version of the stored quotation the draft was typed over; `0` for a new one. */
  baseVersion: number;
  customer: Customer | null;
  form: FormState;
  lines: Omit<GridLine, "key">[];
}

const DRAFT_PREFIX = "kl-quotation-draft:";
const MIN_ROWS = 4;

function subscribeToNothing(): () => void {
  // The draft is only read when the form opens; nothing else writes it while this tab is on the page.
  return () => {};
}

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Storage can be unavailable (private mode); the form simply works without the safety net.
    return null;
  }
}

function parseDraft(stored: string | null): LocalDraft | null {
  if (!stored) return null;
  try {
    const draft = JSON.parse(stored) as LocalDraft;
    return Array.isArray(draft.lines) && draft.form ? draft : null;
  } catch {
    return null;
  }
}

function withoutKey(line: GridLine): Omit<GridLine, "key"> {
  return {
    partNumber: line.partNumber,
    name: line.name,
    unit: line.unit,
    quantity: line.quantity,
    unitCost: line.unitCost,
    fixedCost: line.fixedCost,
    unitPrice: line.unitPrice,
    leadTime: line.leadTime,
    note: line.note,
  };
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function padded(lines: GridLine[]): GridLine[] {
  const rows = [...lines];
  while (rows.length < MIN_ROWS) rows.push(emptyLine());
  return rows;
}

function initialForm(
  quotation: Quotation | undefined,
  customer: Customer | null,
  settings: SalesSettings,
  today: string,
): FormState {
  const contact = customer?.contacts[0];
  return {
    contactName: quotation?.customer.contactName ?? contact?.name ?? "",
    contactPhone: quotation?.customer.contactPhone ?? contact?.phone ?? "",
    contactEmail: quotation?.customer.contactEmail ?? contact?.email ?? "",
    quoteDate: quotation?.quoteDate ?? today,
    validUntil: quotation
      ? (quotation.validUntil ?? "")
      : addDays(today, settings.defaultValidDays),
    vatRate: quotation?.vatRate ?? settings.defaultVatRate,
    paymentTerms: quotation?.paymentTerms ?? "",
    deliveryTerms: quotation?.deliveryTerms ?? "",
    warrantyTerms: quotation?.warrantyTerms ?? "",
    note: quotation?.note ?? "",
  };
}

/**
 * The quotation form: the most used screen of the internal area.
 *
 * Totals, VAT, the suggested price and the margin are previewed in the browser as the salesperson types, with the
 * same arithmetic as the platform; what is saved and printed is always computed by the platform. While typing, the
 * form is also kept in the browser's local storage, so closing the tab — or a session that ran out — loses nothing.
 */
export function QuotationComposer({
  quotation,
  customer: initialCustomer,
  settings,
  today,
}: {
  quotation?: Quotation;
  /** The customer record of an existing quotation, or the one preselected for a new one. */
  customer: Customer | null;
  settings: SalesSettings;
  /** Today in Vietnam, from the server, so server and browser render the same dates. */
  today: string;
}) {
  const router = useRouter();
  const editable = quotation?.editable ?? true;
  const draftKey = `${DRAFT_PREFIX}${quotation?.id ?? "new"}`;
  const [pending, startTransition] = useTransition();
  const [customer, setCustomer] = useState<Customer | null>(initialCustomer);
  const [form, setForm] = useState<FormState>(() =>
    initialForm(quotation, initialCustomer, settings, today),
  );
  const [lines, setLines] = useState<GridLine[]>(() =>
    padded((quotation?.lines ?? []).map(toGridLine)),
  );
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<ActionResult<{ id: string; version: number }> | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const lookedUp = useRef(new Set<string>());

  // A draft left behind by a closed tab or an expired session is offered back, never applied silently. It is read
  // from storage as an external store, so the server render (which has no storage) and the browser agree.
  const storedDraft = useSyncExternalStore(
    subscribeToNothing,
    () => readStorage(draftKey),
    () => null,
  );
  const [draftHandled, setDraftHandled] = useState(false);
  const localDraft = useMemo(() => parseDraft(storedDraft), [storedDraft]);

  useEffect(() => {
    if (!dirty || !editable) return;
    const timer = setTimeout(() => {
      const draft: LocalDraft = {
        savedAt: new Date().toISOString(),
        baseVersion: quotation?.version ?? 0,
        customer,
        form,
        lines: lines.filter((line) => !isBlank(line)).map(withoutKey),
      };
      try {
        window.localStorage.setItem(draftKey, JSON.stringify(draft));
      } catch {
        // Full or unavailable storage must not interrupt typing.
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [dirty, editable, customer, form, lines, draftKey, quotation?.version]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function change<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setSavedAt(null);
  }

  function changeLines(next: GridLine[]) {
    setLines(next);
    setDirty(true);
    setSavedAt(null);
  }

  function selectCustomer(next: Customer | null) {
    setCustomer(next);
    if (next) {
      // The quotation is addressed to the first contact of the newly chosen company.
      const contact = next.contacts[0];
      setForm((current) => ({
        ...current,
        contactName: contact?.name ?? "",
        contactPhone: contact?.phone ?? "",
        contactEmail: contact?.email ?? "",
      }));
    }
    setDirty(true);
    setSavedAt(null);
  }

  function restoreDraft(draft: LocalDraft) {
    setCustomer(draft.customer);
    setForm(draft.form);
    setLines(padded(draft.lines.map((line) => ({ ...emptyLine(), ...line }))));
    setDraftHandled(true);
    setDirty(true);
  }

  function discardDraft() {
    try {
      window.localStorage.removeItem(draftKey);
    } catch {
      // Nothing to clean up when storage is unavailable.
    }
    setDraftHandled(true);
  }

  /** Fills in catalogue names for part numbers that have none yet; each part number is asked for once. */
  function lookUp(partNumbers: string[]) {
    const wanted = partNumbers.filter((value) => !lookedUp.current.has(value));
    if (wanted.length === 0) return;
    wanted.forEach((value) => lookedUp.current.add(value));
    void lookupProductsAction(wanted).then((response) => {
      if (!response.ok || response.data.length === 0) return;
      const found = new Map(response.data.map((match) => [match.requested, match]));
      setLines((current) =>
        current.map((line) => {
          const match = found.get(line.partNumber.trim());
          if (!match) return line;
          return {
            ...line,
            name: line.name.trim() ? line.name : match.name,
            // The catalogue's public price is a starting point when the line has no price yet.
            unitPrice:
              line.unitPrice || match.listPrice === null
                ? line.unitPrice
                : formatNumber(match.listPrice),
          };
        }),
      );
    });
  }

  function save() {
    if (!customer) {
      setResult({ ok: false, message: "Hãy chọn khách hàng cho báo giá." });
      return;
    }
    startTransition(async () => {
      const response = await saveQuotationAction(quotation?.id ?? null, {
        ...form,
        version: quotation?.version,
        customerId: customer.id,
        lines: lines.filter((line) => !isBlank(line)).map(toLineInput),
      });
      setResult(response);
      if (!response.ok) return;
      discardDraft();
      setDirty(false);
      setSavedAt(new Date().toISOString());
      if (quotation) {
        // Part of this transition, so "saved" only shows once the page holds the new version: the status buttons
        // next to the form send that version, and a click in between would be refused as a conflict.
        startTransition(() => router.refresh());
      } else {
        router.push(internalRoutes.quotation(response.data.id));
      }
    });
  }

  const filled = useMemo(() => lines.filter((line) => !isBlank(line)).map(priced), [lines]);
  const net = subtotal(filled);
  const percent = vatRates[form.vatRate].percent;
  const vat = vatAmount(net, percent);
  const profit = totalProfit(filled);
  const margin = percentOf(profit, net);
  const lowMargin = margin !== null && margin < settings.targetMarginPercent;
  // Worth offering only if it holds something and was typed over the version now on screen (or a newer one would
  // have overwritten the stored quotation with stale data).
  const offerDraft =
    localDraft !== null &&
    !draftHandled &&
    editable &&
    !dirty &&
    localDraft.baseVersion === (quotation?.version ?? 0);

  return (
    <div className="space-y-4">
      {offerDraft && localDraft && (
        <Alert tone="warning" title="Có bản đang soạn dở chưa lưu">
          <p>
            Trình duyệt này còn giữ nội dung bạn nhập lúc {formatInstant(localDraft.savedAt)} (
            {localDraft.lines.length} dòng hàng).
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="dark" onClick={() => restoreDraft(localDraft)}>
              <History className="size-4" strokeWidth={1.75} aria-hidden />
              Khôi phục
            </Button>
            <Button size="sm" variant="secondary" onClick={discardDraft}>
              Bỏ bản đó
            </Button>
          </div>
        </Alert>
      )}

      <fieldset disabled={!editable || pending} className="space-y-4">
        <Panel title="Khách hàng">
          <div className="space-y-4">
            <CustomerPicker selected={customer} onSelect={selectCustomer} disabled={!editable} />
            <div className="grid gap-4 md:grid-cols-3">
              <Field id="contactName" label="Người nhận báo giá">
                <Input
                  id="contactName"
                  value={form.contactName}
                  onChange={(event) => change("contactName", event.target.value)}
                  maxLength={100}
                />
              </Field>
              <Field id="contactPhone" label="Điện thoại">
                <Input
                  id="contactPhone"
                  value={form.contactPhone}
                  onChange={(event) => change("contactPhone", event.target.value)}
                  inputMode="tel"
                  maxLength={30}
                />
              </Field>
              <Field id="contactEmail" label="Email">
                <Input
                  id="contactEmail"
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) => change("contactEmail", event.target.value)}
                  maxLength={254}
                />
              </Field>
            </div>
          </div>
        </Panel>

        <div>
          <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-lg">Hàng hóa</h2>
            <p className="text-xs text-muted">
              Giá gợi ý = (giá vốn + chi phí cố định) ÷{" "}
              {formatPercent(100 - settings.targetMarginPercent)}, làm tròn lên{" "}
              {formatNumber(settings.priceRounding)} ₫ — lợi nhuận mục tiêu{" "}
              {settings.targetMarginPercent}% trên giá bán
            </p>
          </div>
          <LineGrid
            lines={lines}
            onChange={changeLines}
            targetMarginPercent={settings.targetMarginPercent}
            priceRounding={settings.priceRounding}
            disabled={!editable}
            onPartNumbers={lookUp}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
          <Panel title="Điều khoản và ghi chú">
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="quoteDate" label="Ngày báo giá">
                <Input
                  id="quoteDate"
                  type="date"
                  value={form.quoteDate}
                  onChange={(event) => change("quoteDate", event.target.value)}
                />
              </Field>
              <Field id="validUntil" label="Hiệu lực đến hết ngày">
                <Input
                  id="validUntil"
                  type="date"
                  value={form.validUntil}
                  min={form.quoteDate}
                  onChange={(event) => change("validUntil", event.target.value)}
                />
              </Field>
              <Field id="paymentTerms" label="Thanh toán" className="md:col-span-2">
                <Input
                  id="paymentTerms"
                  value={form.paymentTerms}
                  onChange={(event) => change("paymentTerms", event.target.value)}
                  placeholder="VD: Chuyển khoản trong vòng 30 ngày kể từ ngày giao hàng"
                  maxLength={1000}
                />
              </Field>
              <Field id="deliveryTerms" label="Giao hàng">
                <Input
                  id="deliveryTerms"
                  value={form.deliveryTerms}
                  onChange={(event) => change("deliveryTerms", event.target.value)}
                  maxLength={1000}
                />
              </Field>
              <Field id="warrantyTerms" label="Bảo hành">
                <Input
                  id="warrantyTerms"
                  value={form.warrantyTerms}
                  onChange={(event) => change("warrantyTerms", event.target.value)}
                  maxLength={1000}
                />
              </Field>
              <Field id="note" label="Ghi chú in trên báo giá" className="md:col-span-2">
                <Textarea
                  id="note"
                  value={form.note}
                  onChange={(event) => change("note", event.target.value)}
                  maxLength={2000}
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Tổng cộng" bodyClassName="space-y-3">
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-body">Cộng tiền hàng</dt>
                <dd className="font-mono text-ink">{formatVnd(net)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 whitespace-nowrap text-body">
                  <label htmlFor="vatRate">Thuế GTGT</label>
                  <Select
                    id="vatRate"
                    value={form.vatRate}
                    onChange={(event) => change("vatRate", event.target.value as VatRate)}
                    className="h-8 w-auto px-2 text-sm"
                  >
                    {Object.entries(vatRates).map(([rate, { label }]) => (
                      <option key={rate} value={rate}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </dt>
                <dd className="font-mono whitespace-nowrap text-ink">
                  {percent === null ? "—" : formatVnd(vat)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-line pt-2">
                <dt className="font-semibold text-ink">Tổng thanh toán</dt>
                <dd className="font-mono text-lg font-semibold text-ink">{formatVnd(net + vat)}</dd>
              </div>
            </dl>
            <dl className="space-y-1.5 rounded-md bg-brand-50 px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-brand-800">Lãi gộp (nội bộ)</dt>
                <dd className="font-mono text-ink">{profit === null ? "—" : formatVnd(profit)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-brand-800">Biên lợi nhuận</dt>
                <dd className={`font-mono ${lowMargin ? "font-semibold text-danger" : "text-ink"}`}>
                  {margin === null ? "—" : formatPercent(margin)}
                </dd>
              </div>
              {profit === null && filled.length > 0 && (
                <p className="text-xs text-brand-800">Nhập giá vốn cho mọi dòng để thấy lãi gộp.</p>
              )}
            </dl>
          </Panel>
        </div>
      </fieldset>

      {editable && (
        <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <Button size="sm" onClick={save} disabled={pending}>
            <Save className="size-4" strokeWidth={1.75} aria-hidden />
            {pending ? "Đang lưu…" : quotation ? "Lưu báo giá" : "Lưu nháp báo giá"}
          </Button>
          {savedAt && !dirty && !pending && (
            <span role="status" className="text-sm text-success">
              Đã lưu.
            </span>
          )}
          {dirty && !pending && <span className="text-sm text-muted">Có thay đổi chưa lưu</span>}
          <FormMessage result={result} className="basis-full" />
        </div>
      )}
    </div>
  );
}
