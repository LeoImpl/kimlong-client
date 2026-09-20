"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * A part number, the single most important piece of text on this site: it is what the visitor searched for, what
 * they compare against the part in their hand, and what they paste into an enquiry. So it is monospaced with
 * tabular figures ("1613900100" must never be mistaken for "1613900i00"), selectable, and copyable in one click.
 */
export function PartNumber({
  value,
  copyable = true,
  className,
}: {
  value: string;
  copyable?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be refused (insecure origin, permission). The number stays selectable, so the
      // visitor can still copy it by hand; failing loudly here would help nobody.
    }
  }

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="font-mono text-sm tracking-tight text-ink select-all">{value}</span>
      {copyable && (
        <button
          type="button"
          onClick={copy}
          className="rounded p-1 text-muted transition-colors hover:bg-surface hover:text-brand-700"
          aria-label={copied ? `Đã sao chép ${value}` : `Sao chép mã ${value}`}
          title={copied ? "Đã sao chép" : "Sao chép"}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      )}
    </span>
  );
}

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
      <path d="M10.5 3.5v-1a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-3.5 text-success"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="m3 8.5 3.5 3.5L13 5" />
    </svg>
  );
}
