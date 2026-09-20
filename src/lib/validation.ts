/**
 * Client-side validation, deliberately the same rules as the platform's domain (`CustomerContact`,
 * `QuoteLine`). It exists to give an immediate, Vietnamese answer next to the field — not to be the
 * authority. The API validates again and is the one that decides.
 */

const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PHONE = /^\+?[0-9][0-9 .-]{6,18}[0-9]$/;
/** Vietnamese enterprise tax code: 10 digits, optionally with a 3-digit branch suffix. */
const TAX_CODE = /^\d{10}(-\d{3})?$/;

export interface ContactValues {
  name: string;
  email: string;
  phone: string;
  company: string;
  taxCode: string;
  address: string;
}

export const emptyContact: ContactValues = {
  name: "",
  email: "",
  phone: "",
  company: "",
  taxCode: "",
  address: "",
};

export type Errors<T> = Partial<Record<keyof T, string>>;

export function validateContact(values: ContactValues): Errors<ContactValues> {
  const errors: Errors<ContactValues> = {};

  const name = values.name.trim();
  if (!name) errors.name = "Vui lòng nhập họ và tên.";
  else if (name.length > 100) errors.name = "Họ và tên tối đa 100 ký tự.";

  const email = values.email.trim();
  if (!email) errors.email = "Vui lòng nhập email để chúng tôi gửi báo giá.";
  else if (!EMAIL.test(email) || email.length > 254) errors.email = "Email chưa đúng định dạng.";

  const phone = values.phone.trim();
  if (!phone) errors.phone = "Vui lòng nhập số điện thoại.";
  else if (!PHONE.test(phone)) errors.phone = "Số điện thoại chưa hợp lệ, ví dụ 0981577876.";

  if (values.company.trim().length > 200) errors.company = "Tên công ty tối đa 200 ký tự.";

  const taxCode = values.taxCode.trim();
  if (taxCode && !TAX_CODE.test(taxCode))
    errors.taxCode = "Mã số thuế gồm 10 chữ số, ví dụ 0312345678.";

  if (values.address.trim().length > 300) errors.address = "Địa chỉ tối đa 300 ký tự.";

  return errors;
}

/** Trims and turns the optional fields into `null`, which is what the API expects for "not given". */
export function toContactPayload(values: ContactValues) {
  const optional = (value: string) => value.trim() || null;
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    company: optional(values.company),
    taxCode: optional(values.taxCode),
    address: optional(values.address),
  };
}

export const MAX_MESSAGE = 2000;

export function validateMessage(message: string, required: boolean): string | undefined {
  const trimmed = message.trim();
  if (required && !trimmed) return "Vui lòng mô tả nhu cầu của bạn.";
  if (trimmed.length > MAX_MESSAGE) return `Nội dung tối đa ${MAX_MESSAGE} ký tự.`;
  return undefined;
}
