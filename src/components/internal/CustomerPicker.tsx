"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Building2, Search } from "lucide-react";
import { findCustomersAction } from "@/app/(internal)/noi-bo/(app)/khach-hang/actions";
import { internalRoutes } from "@/lib/internal/routes";
import type { Customer } from "@/lib/internal/types";

/**
 * Picks one of the salesperson's customers by typing part of the name, tax code or a contact. The search runs on
 * the server as the signed-in salesperson, so customers of colleagues can never appear here.
 */
export function CustomerPicker({
  selected,
  onSelect,
  disabled = false,
}: {
  selected: Customer | null;
  onSelect: (customer: Customer | null) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[] | null>(null);
  const [open, setOpen] = useState(false);
  const latest = useRef(0);

  useEffect(() => {
    if (!open) return;
    const request = ++latest.current;
    const timer = setTimeout(async () => {
      const response = await findCustomersAction(query);
      // Answers can arrive out of order; only the newest one is shown.
      if (request === latest.current) setResults(response.ok ? response.data : []);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, open]);

  if (selected) {
    return (
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-line bg-surface px-3 py-2.5">
        <div className="flex min-w-0 items-start gap-2.5">
          <Building2 className="mt-0.5 size-5 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
          <div className="min-w-0">
            <Link
              href={internalRoutes.customer(selected.id)}
              className="font-semibold text-ink hover:text-action-700 hover:underline"
            >
              {selected.companyName}
            </Link>
            <p className="text-xs text-muted">
              {selected.taxCode ? (
                <>
                  MST <span className="font-mono">{selected.taxCode}</span>
                </>
              ) : (
                "Chưa có MST"
              )}
              {selected.taxAddress ? ` · ${selected.taxAddress}` : ""}
            </p>
          </div>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setOpen(true);
            }}
            className="text-sm font-medium text-action-600 hover:text-action-700"
          >
            Đổi khách hàng
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
          strokeWidth={1.75}
          aria-hidden
        />
        <input
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls="customer-options"
          aria-label="Tìm khách hàng"
          placeholder="Tìm khách hàng theo tên, MST, người liên hệ…"
          value={query}
          disabled={disabled}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setOpen(true)}
          className="h-10 w-full rounded-md border border-line-strong bg-page pr-3 pl-9 text-sm text-ink placeholder:text-muted focus:border-action-600"
        />
      </div>
      {open && (
        <ul
          id="customer-options"
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-line bg-page shadow-[0_10px_24px_-12px_rgb(28_34_39/0.35)]"
        >
          {results === null && <li className="px-3 py-2 text-sm text-muted">Đang tìm…</li>}
          {results?.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted">
              Không có khách hàng phù hợp.{" "}
              <Link
                href={internalRoutes.newCustomer}
                className="font-medium text-action-600 underline"
              >
                Thêm khách hàng mới
              </Link>
            </li>
          )}
          {results?.map((customer) => (
            <li key={customer.id} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => {
                  onSelect(customer);
                  setOpen(false);
                  setQuery("");
                }}
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-action-50"
              >
                <span className="text-sm font-semibold text-ink">{customer.companyName}</span>
                <span className="text-xs text-muted">
                  {customer.taxCode ? `MST ${customer.taxCode}` : "Chưa có MST"}
                  {customer.contacts[0] ? ` · ${customer.contacts[0].name}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
