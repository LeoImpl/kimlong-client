"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

/** An internal page failed: usually the API is down. Offer a retry; the public site's "call us" page is no use here. */
export default function InternalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Internal page failed to render", error);
  }, [error]);

  return (
    <div className="rounded-lg border border-danger/20 bg-danger-soft px-6 py-10 text-center">
      <h1 className="text-2xl text-danger">Không tải được dữ liệu</h1>
      <p className="mx-auto mt-2 max-w-lg text-sm text-body">
        Máy chủ không phản hồi hoặc có lỗi khi xử lý. Vui lòng thử lại; nếu vẫn lỗi, gửi mã bên dưới
        cho quản trị viên.
      </p>
      <div className="mt-5 flex justify-center">
        <Button size="sm" onClick={reset}>
          Thử lại
        </Button>
      </div>
      {error.digest && <p className="mt-4 font-mono text-xs text-muted">Mã lỗi: {error.digest}</p>}
    </div>
  );
}
