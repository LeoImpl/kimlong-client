"use client";

import { useEffect } from "react";
import { ButtonLink, Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { routes } from "@/lib/routes";

/**
 * Shown when the API is unreachable or answers with something unexpected. The site's job in that moment is to
 * degrade to "phone us", not to show a blank page — that is the whole point of the business.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is what ties this to the server log line; the correlation ID is in the API client's error.
    console.error("Page failed to render", error);
  }, [error]);

  return (
    <Container className="py-16 text-center lg:py-24">
      <h1 className="text-[2rem] leading-tight sm:text-[2.5rem]">Trang tạm thời không tải được</h1>
      <p className="mx-auto mt-3 max-w-lg text-body">
        Vui lòng thử lại sau ít phút. Nếu cần gấp, hãy gọi hotline — chúng tôi vẫn nhận yêu cầu qua
        điện thoại và Zalo bình thường.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Thử lại</Button>
        <ButtonLink href={routes.home} variant="secondary">
          Về trang chủ
        </ButtonLink>
      </div>
      {error.digest && <p className="mt-6 font-mono text-xs text-muted">Mã lỗi: {error.digest}</p>}
    </Container>
  );
}
