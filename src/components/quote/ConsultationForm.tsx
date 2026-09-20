"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Field";
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

/**
 * The contact page's form: a consultation request, which the API accepts with no lines but a required message.
 * This is the path for the buyer who does not know the part number — "máy nén khí GA22, cần lọc dầu" — and it
 * is worth as much as a quote, because sales can identify the part from the machine.
 */
export function ConsultationForm({ hotline }: { hotline: string | null }) {
  const router = useRouter();
  const [contact, setContact] = useState<ContactValues>(emptyContact);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Errors<ContactValues> & { message?: string }>({});
  const { state, submit } = useSubmission();

  const sending = state.status === "sending";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const contactErrors = validateContact(contact);
    const messageError = validateMessage(message, true);
    // flushSync so `aria-invalid` is in the DOM before focusFirstInvalid() looks for it.
    flushSync(() => setErrors({ ...contactErrors, message: messageError }));
    if (Object.keys(contactErrors).length > 0 || messageError) {
      focusFirstInvalid();
      return;
    }

    const submitted = await submit({
      contact: toContactPayload(contact),
      type: "CONSULTATION",
      message: message.trim(),
      lines: [],
      website,
    });

    if (submitted)
      router.push(`${routes.quoteSent}?ref=${encodeURIComponent(submitted.reference)}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="relative rounded-lg border border-line bg-page p-5 sm:p-6"
    >
      <Honeypot value={website} onChange={setWebsite} />

      <ContactFields
        values={contact}
        errors={errors}
        onChange={(changes) => setContact((current) => ({ ...current, ...changes }))}
        disabled={sending}
        idPrefix="contact"
      />

      <Field
        id="contact-message"
        label="Bạn cần tư vấn gì?"
        required
        hint="Mô tả máy, model, hoặc mã sản phẩm bạn đang tìm. Càng cụ thể chúng tôi càng trả lời nhanh."
        error={errors.message}
        className="mt-4"
      >
        <Textarea
          id="contact-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "contact-message-error" : "contact-message-hint"}
          rows={5}
          placeholder="Ví dụ: Máy nén khí Atlas Copco GA22, cần lọc dầu và lọc tách dầu cho kỳ bảo dưỡng 4000 giờ."
          disabled={sending}
        />
      </Field>

      {state.status === "failed" && (
        <div className="mt-4">
          <SubmissionAlert failure={state.failure} hotline={hotline} />
        </div>
      )}

      <Button type="submit" size="lg" className="mt-5" disabled={sending}>
        {sending ? "Đang gửi…" : "Gửi yêu cầu tư vấn"}
      </Button>
    </form>
  );
}
