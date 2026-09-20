"use client";

import { Alert } from "@/components/ui/Feedback";
import { formatPhone, telHref, zaloHref } from "@/lib/phone";
import type { SubmissionFailure } from "./submission";

/** A failed submission, with the phone number when retrying will not help. */
export function SubmissionAlert({
  failure,
  hotline,
}: {
  failure: SubmissionFailure;
  hotline: string | null;
}) {
  return (
    <Alert tone={failure.callInstead ? "warning" : "danger"} title="Chưa gửi được yêu cầu">
      <p>{failure.message}</p>
      {failure.callInstead && hotline && (
        <p className="mt-2">
          <a href={telHref(hotline)} className="font-semibold underline">
            Gọi {formatPhone(hotline)}
          </a>
          {" · "}
          <a
            href={zaloHref(hotline)}
            target="_blank"
            rel="noopener"
            className="font-semibold underline"
          >
            Chat Zalo
          </a>
        </p>
      )}
      {failure.correlationId && (
        <p className="mt-2 font-mono text-xs opacity-70">Mã lỗi: {failure.correlationId}</p>
      )}
    </Alert>
  );
}
