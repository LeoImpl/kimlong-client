"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api/problem";
import { submitQuoteRequest } from "@/lib/api/quotes";
import type { SubmitQuoteRequest, Submitted } from "@/lib/api/types";

export interface SubmissionFailure {
  /** Shown above the form. */
  message: string;
  /** True when retrying immediately cannot help, so the UI offers the phone instead. */
  callInstead: boolean;
  /** Ties a user's report to the backend log line. */
  correlationId?: string;
}

export type SubmissionState =
  { status: "idle" } | { status: "sending" } | { status: "failed"; failure: SubmissionFailure };

/**
 * Wraps the one call this app makes from the browser and turns every failure into something a Vietnamese buyer
 * can act on. The rate limit in particular (5 submissions per IP per 10 minutes) must never surface as "429".
 */
export function useSubmission() {
  const [state, setState] = useState<SubmissionState>({ status: "idle" });

  async function submit(request: SubmitQuoteRequest): Promise<Submitted | null> {
    setState({ status: "sending" });
    try {
      const submitted = await submitQuoteRequest(request);
      return submitted;
    } catch (error) {
      setState({ status: "failed", failure: describe(error) });
      return null;
    }
  }

  return { state, submit, reset: () => setState({ status: "idle" }) };
}

function describe(error: unknown): SubmissionFailure {
  if (!(error instanceof ApiError)) {
    return { message: "Đã có lỗi xảy ra. Vui lòng thử lại.", callInstead: false };
  }
  if (error.isRateLimited) {
    return {
      message:
        "Bạn đã gửi khá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau khoảng 10 phút — hoặc gọi trực tiếp, " +
        "chúng tôi nhận yêu cầu qua điện thoại và Zalo bình thường.",
      callInstead: true,
      correlationId: error.correlationId,
    };
  }
  if (error.status === 0) {
    return {
      message:
        "Không kết nối được tới máy chủ. Vui lòng kiểm tra mạng và thử lại, hoặc gọi cho chúng tôi.",
      callInstead: true,
      correlationId: error.correlationId,
    };
  }
  if (error.status >= 400 && error.status < 500) {
    return {
      message: error.problem?.detail ?? "Thông tin gửi lên chưa hợp lệ. Vui lòng kiểm tra lại.",
      callInstead: false,
      correlationId: error.correlationId,
    };
  }
  return {
    message: "Máy chủ đang gặp sự cố. Vui lòng thử lại sau ít phút hoặc gọi cho chúng tôi.",
    callInstead: true,
    correlationId: error.correlationId,
  };
}

/**
 * Moves focus to the first field the form marked invalid, which also scrolls it into view — on a phone the
 * offending field is usually off-screen, and a form that silently does nothing reads as broken.
 *
 * Call it *after* `flushSync(() => setErrors(...))`: React commits state asynchronously, so without the flush
 * no element carries `aria-invalid` yet and this would find nothing.
 */
export function focusFirstInvalid(): void {
  document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
}
