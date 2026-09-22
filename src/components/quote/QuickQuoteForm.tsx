"use client";

import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { useState } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Field, Select, Textarea } from "@/components/ui/Field";
import { quoteLine } from "@/lib/api/quotes";
import { DEFAULT_UNIT } from "@/lib/basket";
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
 * The one-product path. A visitor who wants exactly one filter should not have to learn what a basket is — the
 * alternative for them is to close the tab and phone, and half of those calls never happen.
 */
export function QuickQuoteForm({
  product,
  partNumbers,
  hotline,
}: {
  product: { slug: string; name: string };
  partNumbers: string[];
  hotline: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [partNumber, setPartNumber] = useState(partNumbers[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState(DEFAULT_UNIT);
  const [contact, setContact] = useState<ContactValues>(emptyContact);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Errors<ContactValues> & { message?: string }>({});
  const { state, submit } = useSubmission();

  const sending = state.status === "sending";

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
      lines: [
        quoteLine({ productSlug: product.slug, partNumber: partNumber || null, quantity, unit }),
      ],
      website,
    });

    if (submitted)
      router.push(`${routes.quoteSent}?ref=${encodeURIComponent(submitted.reference)}`);
  }

  if (!open) {
    return (
      <Button variant="secondary" size="lg" onClick={() => setOpen(true)}>
        <Zap className="size-4" strokeWidth={1.5} aria-hidden />
        Báo giá nhanh
      </Button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="relative rounded-lg border border-line/80 bg-page p-5 shadow-card"
    >
      <Honeypot value={website} onChange={setWebsite} />

      <h2 className="text-base font-semibold text-ink">Báo giá nhanh</h2>
      <p className="mt-1 text-sm text-muted">{product.name}</p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        {partNumbers.length > 1 && (
          <label className="text-sm">
            <span className="mb-1 block text-muted">Mã sản phẩm</span>
            <Select
              value={partNumber}
              onChange={(event) => setPartNumber(event.target.value)}
              className="font-mono"
              disabled={sending}
            >
              {partNumbers.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </label>
        )}
        <label className="text-sm">
          <span className="mb-1 block text-muted">Số lượng</span>
          <input
            type="number"
            min={1}
            max={9999}
            value={quantity}
            disabled={sending}
            onChange={(event) => setQuantity(Number(event.target.value))}
            className="h-10 w-24 rounded-md border border-line-strong bg-page px-3 text-sm text-ink"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Đơn vị</span>
          <Select
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            className="w-28"
            disabled={sending}
          >
            {UNITS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="mt-5">
        <ContactFields
          values={contact}
          errors={errors}
          onChange={(changes) => setContact((current) => ({ ...current, ...changes }))}
          disabled={sending}
          idPrefix="quick"
        />
      </div>

      <Field id="quick-message" label="Ghi chú" error={errors.message} className="mt-4">
        <Textarea
          id="quick-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          invalid={Boolean(errors.message)}
          rows={3}
          disabled={sending}
        />
      </Field>

      {state.status === "failed" && (
        <div className="mt-4">
          <SubmissionAlert failure={state.failure} hotline={hotline} />
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="submit" size="lg" disabled={sending}>
          {sending ? "Đang gửi…" : "Gửi yêu cầu"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={sending}>
          Đóng
        </Button>
      </div>
    </form>
  );
}
