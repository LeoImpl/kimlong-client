"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { exportDocumentAction } from "@/app/(internal)/noi-bo/(app)/bao-gia/actions";
import { FormMessage } from "@/components/internal/FormMessage";
import { Button } from "@/components/ui/Button";
import type { ActionResult } from "@/lib/internal/action-result";
import { formatFileSize, formatInstant } from "@/lib/internal/format";
import { internalRoutes } from "@/lib/internal/routes";
import type { DocumentFormat, Quotation, StoredDocument } from "@/lib/internal/types";

/**
 * Exports the quotation and lists every file exported so far. Each export is kept exactly as it was produced —
 * the list is the history of what was offered while negotiating — and downloading returns those same bytes.
 */
export function QuotationFiles({
  quotation,
  documents,
}: {
  quotation: Quotation;
  documents: StoredDocument[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<StoredDocument> | null>(null);
  const empty = quotation.lines.length === 0;

  function exportAs(format: DocumentFormat) {
    startTransition(async () => {
      const response = await exportDocumentAction(quotation.id, format);
      setResult(response);
      if (!response.ok) return;
      // A navigation to an attachment downloads it and leaves this page where it is.
      window.location.assign(internalRoutes.quotationFile(quotation.id, response.data.id));
      startTransition(() => router.refresh());
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={pending || empty}
          onClick={() => exportAs("PDF")}
        >
          <FileText className="size-4" strokeWidth={1.75} aria-hidden />
          Xuất PDF
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={pending || empty}
          onClick={() => exportAs("XLSX")}
        >
          <FileSpreadsheet className="size-4" strokeWidth={1.75} aria-hidden />
          Xuất Excel
        </Button>
        <span className="text-xs text-muted">
          {empty
            ? "Thêm dòng hàng và lưu trước khi xuất."
            : "File được xuất theo bản đã lưu; giá vốn và chi phí không bao giờ có trong file."}
        </span>
      </div>
      {result?.ok && quotation.status === "DRAFT" && (
        <p role="status" className="text-sm text-body">
          Đã xuất file. Khi gửi cho khách, bấm{" "}
          <span className="font-semibold">Đánh dấu đã gửi khách</span> ở trên để báo giá được tính
          là đã gửi.
        </p>
      )}
      <FormMessage result={result} />

      {documents.length > 0 && (
        <ul className="divide-y divide-line rounded-md border border-line">
          {documents.map((document) => (
            <li
              key={document.id}
              className="flex flex-wrap items-center justify-between gap-3 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                {document.format === "PDF" ? (
                  <FileText className="size-5 shrink-0 text-danger" strokeWidth={1.5} aria-hidden />
                ) : (
                  <FileSpreadsheet
                    className="size-5 shrink-0 text-success"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm text-ink">{document.filename}</p>
                  <p className="text-xs text-muted">
                    {formatInstant(document.createdAt)} · {document.createdBy.name} ·{" "}
                    {formatFileSize(document.sizeBytes)} · mẫu {document.templateVersion}
                  </p>
                </div>
              </div>
              {/* A plain link: this is a file download, not a page to prefetch. */}
              <a
                href={internalRoutes.quotationFile(quotation.id, document.id)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-action-600 hover:text-action-700"
              >
                <Download className="size-4" strokeWidth={1.75} aria-hidden />
                Tải lại
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
