"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * A part number, the single most important piece of text on this site: it is what the visitor searched for, what
 * they compare against the part in their hand, and what they paste into an enquiry. So it is monospaced with
 * tabular figures ("1613900100" must never be mistaken for "1613900i00"), selectable, and copyable in one click.
 *
 * `copyTabbable={false}` keeps the copy button out of the Tab order, for tables where Tab should jump from one
 * quantity field to the next.
 */
export function PartNumber({
  value,
  copyable = true,
  copyTabbable = true,
  className,
}: {
  value: string;
  copyable?: boolean;
  copyTabbable?: boolean;
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
    <span className={cn("group/pn inline-flex items-center gap-1 text-[13px]", className)}>
      <span className="font-mono font-medium tracking-tight text-ink select-all">{value}</span>
      {copyable && (
        <button
          type="button"
          onClick={copy}
          tabIndex={copyTabbable ? undefined : -1}
          className="rounded p-1 text-muted opacity-60 transition hover:bg-surface hover:text-brand-700 hover:opacity-100 focus-visible:opacity-100 group-hover/pn:opacity-100"
          aria-label={copied ? `Đã sao chép ${value}` : `Sao chép mã ${value}`}
          title={copied ? "Đã sao chép" : "Sao chép"}
        >
          {copied ? (
            <Check className="size-3.5 text-success" strokeWidth={2} aria-hidden />
          ) : (
            <Copy className="size-3.5" strokeWidth={1.5} aria-hidden />
          )}
        </button>
      )}
    </span>
  );
}
