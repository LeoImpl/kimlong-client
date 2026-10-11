import { ApiError } from "@/lib/api/problem";

/**
 * What a server action of the internal area answers. Actions never throw for an expected failure: the form shows
 * `message`, and `correlationId` ties a report from a salesperson to the backend log line.
 */
export type ActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; message: string; code?: string; correlationId?: string };

export function success(): ActionResult;
export function success<T>(data: T): ActionResult<T>;
export function success<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

/** Messages for error codes the internal area explains in its own words; everything else falls back by status. */
const messages: Record<string, string> = {
  "sales.customer.tax-code-exists": "MST này đã có trong danh sách khách hàng của bạn.",
  "sales.customer.tax-code-assigned": "MST này đã có người phụ trách, vui lòng liên hệ admin.",
  "sales.customer.tax-code-invalid":
    "MST không hợp lệ: cần 10 chữ số, có thể thêm -NNN cho chi nhánh.",
  "sales.customer.name-invalid": "Tên công ty là bắt buộc (tối đa 200 ký tự).",
  "sales.customer.inactive": "Khách hàng này đang ngừng dùng. Hãy kích hoạt lại trước khi báo giá.",
  "sales.customer.assignee-unknown": "Nhân viên này chưa từng đăng nhập khu vực nội bộ.",
  "sales.contact.name-invalid": "Tên người liên hệ là bắt buộc (tối đa 100 ký tự).",
  "sales.contact.phone-invalid": "Số điện thoại người liên hệ không hợp lệ.",
  "sales.contact.email-invalid": "Email người liên hệ không hợp lệ.",
  "sales.lines.required": "Báo giá cần ít nhất một dòng hàng.",
  "sales.line.empty": "Mỗi dòng cần có mã hàng hoặc tên hàng.",
  "sales.line.quantity-invalid": "Số lượng phải từ 1 đến 1.000.000.",
  "sales.quotation.validity-invalid": "Ngày hết hiệu lực không được trước ngày báo giá.",
  "sales.quotation.status-invalid": "Báo giá đang ở trạng thái không cho phép thao tác này.",
  "sales.order.status-invalid": "Đơn hàng đang ở trạng thái không cho phép thao tác này.",
  "sales.payment.too-much": "Số tiền thu vượt quá số còn phải thu của đơn hàng.",
  "sales.payment.amount-invalid": "Số tiền thu phải lớn hơn 0.",
  "sales.web-request.taken": "Yêu cầu này vừa được nhân viên khác nhận.",
  "sales.web-request.closed": "Yêu cầu này đã đóng, không nhận được nữa.",
  "sales.web-request.not-claimed": "Hãy nhận yêu cầu trước khi tạo báo giá.",
  "sales.web-request.customer-required":
    "Chưa có khách hàng nào của bạn trùng MST với yêu cầu này. Hãy tạo khách hàng trước.",
  "sales.quoted-prices.part-number-too-short": "Nhập ít nhất 2 ký tự của mã hàng.",
  "money.negative": "Số tiền không được âm.",
};

/**
 * Turns a failed API call into a result. Anything that is not an API error is rethrown — that includes the
 * redirect `requireStaff()` throws when the session is gone, which the action runtime must see.
 */
export function failure(error: unknown): ActionResult<never> {
  if (!(error instanceof ApiError)) throw error;
  const base = { code: error.code, correlationId: error.correlationId };
  const known = error.code ? messages[error.code] : undefined;
  if (known) return { ok: false, message: known, ...base };
  if (error.status === 409) {
    return {
      ok: false,
      message:
        "Dữ liệu vừa được người khác sửa. Hãy tải lại trang để lấy bản mới nhất rồi làm lại.",
      ...base,
    };
  }
  if (error.status === 0) {
    return {
      ok: false,
      message: "Không kết nối được máy chủ. Vui lòng thử lại sau ít phút.",
      ...base,
    };
  }
  if (error.status === 403) {
    return { ok: false, message: "Bạn không có quyền thực hiện thao tác này.", ...base };
  }
  if (error.status === 404) {
    return {
      ok: false,
      message: "Không tìm thấy dữ liệu, hoặc dữ liệu thuộc khách hàng của nhân viên khác.",
      ...base,
    };
  }
  if (error.status === 400 || error.status === 422) {
    // The API's own sentence is in English, but it names the field, which is better than nothing.
    return { ok: false, message: `Dữ liệu chưa hợp lệ: ${error.message}`, ...base };
  }
  return { ok: false, message: "Có lỗi khi xử lý. Vui lòng thử lại.", ...base };
}
