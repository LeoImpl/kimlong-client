/**
 * The platform returns RFC 7807 problem details on every error, extended with two fields that matter here:
 *
 * ```json
 * { "status": 404, "title": "Not Found", "detail": "Product khong-ton-tai does not exist.",
 *   "instance": "/api/public/v1/catalog/products/khong-ton-tai",
 *   "code": "catalog.product-not-found",
 *   "correlationId": "27de3002-9e93-489d-87b3-d182be642c53" }
 * ```
 *
 * `code` is stable and safe to branch on; `detail` is a human sentence and may change.
 */
export interface ProblemDetail {
  status: number;
  title?: string;
  detail?: string;
  instance?: string;
  /** Stable machine-readable error code, e.g. `catalog.product-not-found`. */
  code?: string;
  /** Ties this failure to the backend log line that produced it. */
  correlationId?: string;
  /** Present on validation failures. */
  errors?: Array<{ field?: string; message?: string }>;
}

/** Error codes this client reacts to by name rather than by status. */
export const ErrorCode = {
  PRODUCT_NOT_FOUND: "catalog.product-not-found",
  CATEGORY_NOT_FOUND: "catalog.category-not-found",
  RATE_LIMITED: "inquiry.rate-limited",
} as const;

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly correlationId?: string;
  readonly problem?: ProblemDetail;

  constructor(
    message: string,
    status: number,
    problem?: ProblemDetail,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "ApiError";
    this.status = status;
    this.code = problem?.code;
    this.correlationId = problem?.correlationId;
    this.problem = problem;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** Submission limit: 5 per IP per 10 minutes. The UI must offer the phone number instead of retrying. */
  get isRateLimited(): boolean {
    return this.status === 429;
  }

  get validationErrors(): Array<{ field?: string; message?: string }> {
    return this.problem?.errors ?? [];
  }
}
