"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { FileUp, Package, Trash2 } from "lucide-react";
import { flushSync } from "react-dom";
import { ButtonLink, Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { Field, Textarea } from "@/components/ui/Field";
import { PartNumber } from "@/components/ui/PartNumber";
import { Select } from "@/components/ui/Field";
import { quoteLine } from "@/lib/api/quotes";
import { lineId, MAX_QUANTITY, type BasketLine } from "@/lib/basket";
import { basket, useBasket } from "@/lib/basket-store";
import { routes } from "@/lib/routes";
import {
  emptyContact,
  toContactPayload,
  validateContact,
  validateMessage,
  type ContactValues,
  type Errors,
} from "@/lib/validation";
import { ContactFields, Honeypot } from "./ContactFields";
import { SubmissionAlert } from "./SubmissionAlert";
import { focusFirstInvalid, useSubmission } from "./submission";

const UNITS = ["cái", "bộ", "chiếc", "mét", "kg", "lít", "hộp"];

/**
 * The basket review and the contact form on one page. Splitting them over two steps would add a click to the
 * one action the whole site exists for.
 */
export function QuoteForm({ hotline }: { hotline: string | null }) {
  const router = useRouter();
  const lines = useBasket();
  const [contact, setContact] = useState<ContactValues>(emptyContact);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Errors<ContactValues> & { message?: string }>({});
  const { state, submit } = useSubmission();

  if (lines.length === 0) {
    return (
      <EmptyState
        title="Chưa có sản phẩm nào trong yêu cầu"
        description="Thêm sản phẩm từ trang sản phẩm, hoặc gửi yêu cầu tư vấn nếu bạn chưa biết chính xác mã cần mua."
        action={
          <>
            <ButtonLink href={routes.products}>Xem sản phẩm</ButtonLink>
            <ButtonLink href={routes.contact} variant="secondary">
              Gửi yêu cầu tư vấn
            </ButtonLink>
          </>
        }
      />
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const contactErrors = validateContact(contact);
    const messageError = validateMessage(message, false);
    // flushSync so `aria-invalid` is in the DOM before focusFirstInvalid() looks for it.
    flushSync(() => setErrors({ ...contactErrors, message: messageError }));
    if (Object.keys(contactErrors).length > 0 || messageError) {
      focusFirstInvalid();
      return;
    }

    const submitted = await submit({
      contact: toContactPayload(contact),
      type: "QUOTE",
      message: message.trim() || null,
      lines: lines.map(quoteLine),
      website,
    });

    if (submitted) {
      basket.clear();
      router.push(`${routes.quoteSent}?ref=${encodeURIComponent(submitted.reference)}`);
    }
  }

  const sending = state.status === "sending";

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="relative mt-8 grid gap-8 lg:grid-cols-[1fr_380px]"
    >
      <Honeypot value={website} onChange={setWebsite} />

      <section aria-labelledby="lines-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="lines-heading" className="text-lg font-semibold text-ink">
            Sản phẩm cần báo giá{" "}
            <span className="font-mono text-base font-medium text-muted">({lines.length})</span>
          </h2>
          <Link
            href={routes.quickOrder}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
          >
            <FileUp className="size-4" strokeWidth={1.5} aria-hidden />
            Thêm từ danh sách mã / CSV
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-line/80 overflow-hidden rounded-lg border border-line/80 bg-page shadow-card">
          {lines.map((line) => (
            <LineRow key={lineId(line)} line={line} disabled={sending} />
          ))}
        </ul>

        <Field
          id="quote-message"
          label="Ghi chú"
          hint="Model máy, thời gian cần hàng, yêu cầu chứng từ…"
          error={errors.message}
          className="mt-6"
        >
          <Textarea
            id="quote-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            invalid={Boolean(errors.message)}
            rows={4}
            disabled={sending}
          />
        </Field>
      </section>

      <section aria-labelledby="contact-heading" className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-lg border border-line/80 bg-page p-5 shadow-card">
          <h2 id="contact-heading" className="text-lg font-semibold text-ink">
            Thông tin liên hệ
          </h2>
          <p className="mt-1 text-sm text-muted">
            Chúng tôi gửi báo giá qua email và gọi lại nếu cần làm rõ.
          </p>

          <div className="mt-4">
            <ContactFields
              values={contact}
              errors={errors}
              onChange={(changes) => setContact((current) => ({ ...current, ...changes }))}
              disabled={sending}
              idPrefix="quote"
            />
          </div>

          {state.status === "failed" && (
            <div className="mt-4">
              <SubmissionAlert failure={state.failure} hotline={hotline} />
            </div>
          )}

          <Button type="submit" size="lg" className="mt-5 w-full" disabled={sending}>
            {sending ? "Đang gửi…" : "Gửi yêu cầu báo giá"}
          </Button>
          <p className="mt-3 text-xs text-muted">
            Bằng việc gửi yêu cầu, bạn đồng ý để chúng tôi liên hệ lại theo thông tin ở trên.
          </p>
        </div>
      </section>
    </form>
  );
}

function LineRow({ line, disabled }: { line: BasketLine; disabled: boolean }) {
  const id = lineId(line);

  return (
    <li className="flex gap-4 px-4 py-4 transition-colors hover:bg-slate-50/80">
      <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line/80 bg-page">
        {line.imageUrl ? (
          <Image src={line.imageUrl} alt="" fill sizes="64px" className="object-contain p-1" />
        ) : (
          <Package className="size-6 text-line-strong" strokeWidth={1.5} aria-hidden />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">
          {line.productSlug ? (
            <Link href={routes.product(line.productSlug)} className="hover:text-brand-700">
              {line.productName}
            </Link>
          ) : (
            line.productName
          )}
        </p>
        {line.partNumber && (
          <div className="mt-1">
            <PartNumber value={line.partNumber} copyable={false} className="text-xs" />
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted">
            SL
            <input
              type="number"
              min={1}
              max={MAX_QUANTITY}
              value={line.quantity}
              disabled={disabled}
              onChange={(event) => basket.update(id, { quantity: Number(event.target.value) })}
              className="h-9 w-20 rounded-md border border-line-strong bg-page px-2 text-right font-mono text-sm text-ink shadow-card focus:border-brand-700"
              aria-label={`Số lượng của ${line.productName}`}
            />
          </label>

          <Select
            value={line.unit}
            disabled={disabled}
            onChange={(event) => basket.update(id, { unit: event.target.value })}
            className="h-9 w-24 text-sm"
            aria-label={`Đơn vị của ${line.productName}`}
          >
            {UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </Select>

          <button
            type="button"
            onClick={() => basket.remove(id)}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="size-4" strokeWidth={1.5} aria-hidden />
            Xóa
          </button>
        </div>
      </div>
    </li>
  );
}
