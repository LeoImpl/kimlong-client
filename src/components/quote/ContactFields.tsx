"use client";

import { Field, Input, Textarea } from "@/components/ui/Field";
import type { ContactValues, Errors } from "@/lib/validation";

/**
 * The contact block, shared by the quote form and the contact page.
 *
 * Company, tax code and address are optional but asked for anyway: sales need them to issue a VAT invoice, and
 * a buyer who fills them in now saves an e-mail round trip later.
 */
export function ContactFields({
  values,
  errors,
  onChange,
  disabled,
  idPrefix,
}: {
  values: ContactValues;
  errors: Errors<ContactValues>;
  onChange: (changes: Partial<ContactValues>) => void;
  disabled?: boolean;
  idPrefix: string;
}) {
  const id = (name: keyof ContactValues) => `${idPrefix}-${name}`;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field id={id("name")} label="Họ và tên" required error={errors.name}>
        <Input
          id={id("name")}
          value={values.name}
          onChange={(event) => onChange({ name: event.target.value })}
          invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${id("name")}-error` : undefined}
          autoComplete="name"
          disabled={disabled}
        />
      </Field>

      <Field id={id("phone")} label="Số điện thoại" required error={errors.phone}>
        <Input
          id={id("phone")}
          type="tel"
          inputMode="tel"
          value={values.phone}
          onChange={(event) => onChange({ phone: event.target.value })}
          invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? `${id("phone")}-error` : undefined}
          autoComplete="tel"
          placeholder="0981577876"
          disabled={disabled}
        />
      </Field>

      <Field id={id("email")} label="Email" required error={errors.email} className="sm:col-span-2">
        <Input
          id={id("email")}
          type="email"
          value={values.email}
          onChange={(event) => onChange({ email: event.target.value })}
          invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${id("email")}-error` : undefined}
          autoComplete="email"
          placeholder="ten@congty.com"
          disabled={disabled}
        />
      </Field>

      <Field id={id("company")} label="Công ty" error={errors.company}>
        <Input
          id={id("company")}
          value={values.company}
          onChange={(event) => onChange({ company: event.target.value })}
          invalid={Boolean(errors.company)}
          autoComplete="organization"
          disabled={disabled}
        />
      </Field>

      <Field
        id={id("taxCode")}
        label="Mã số thuế"
        hint="Để xuất hóa đơn VAT."
        error={errors.taxCode}
      >
        <Input
          id={id("taxCode")}
          value={values.taxCode}
          onChange={(event) => onChange({ taxCode: event.target.value })}
          invalid={Boolean(errors.taxCode)}
          inputMode="numeric"
          placeholder="0312345678"
          disabled={disabled}
        />
      </Field>

      <Field
        id={id("address")}
        label="Địa chỉ nhận hàng"
        error={errors.address}
        className="sm:col-span-2"
      >
        <Textarea
          id={id("address")}
          value={values.address}
          onChange={(event) => onChange({ address: event.target.value })}
          invalid={Boolean(errors.address)}
          rows={2}
          autoComplete="street-address"
          disabled={disabled}
        />
      </Field>
    </div>
  );
}

/**
 * The honeypot the API checks. It must be in the DOM, empty when a human submits, and invisible — but not
 * `type="hidden"` and not `display:none` on the input itself, because bots fill exactly those. An off-screen
 * wrapper with `aria-hidden` and `tabindex="-1"` keeps it away from both humans and assistive technology while
 * still looking like a real field to a scraper.
 */
export function Honeypot({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div aria-hidden className="absolute left-[-9999px] h-px w-px overflow-hidden">
      <label htmlFor="website">Website</label>
      <input
        id="website"
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
