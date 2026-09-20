"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

/**
 * The most used control on the site. Two things are deliberate:
 *
 * - it is a real `<form method="get" action="/san-pham">`, so it works before hydration and without JavaScript —
 *   which is also how the crawlers see it;
 * - the placeholder says "tên hoặc mã sản phẩm", because part numbers are what people actually type and the
 *   search matches them ignoring separators and case (`dsbc 32 50` finds `DSBC-32-50-PPVA-N3`).
 */
export function SearchBox({
  defaultValue = "",
  autoFocus,
  className,
  size = "md",
}: {
  defaultValue?: string;
  autoFocus?: boolean;
  className?: string;
  size?: "md" | "lg";
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  // The home page renders this twice (header and hero), so the id cannot be a constant.
  const id = useId();

  return (
    <form
      role="search"
      action={routes.products}
      method="get"
      onSubmit={(event) => {
        // Client-side navigation keeps the shell mounted; the native GET stays as the no-JS fallback.
        event.preventDefault();
        const query = value.trim();
        router.push(query ? routes.search(query) : routes.products);
      }}
      className={cn("relative flex w-full", className)}
    >
      <label htmlFor={id} className="sr-only">
        Tìm sản phẩm
      </label>
      <input
        id={id}
        type="search"
        name="q"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Tìm theo tên hoặc mã sản phẩm…"
        autoComplete="off"
        className={cn(
          "w-full rounded-md border border-line-strong bg-page pr-24 pl-10 text-sm text-ink",
          "placeholder:text-muted hover:border-muted",
          size === "lg" ? "h-12" : "h-10",
        )}
      />
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
      <button
        type="submit"
        className={cn(
          "absolute top-1/2 right-1 -translate-y-1/2 rounded bg-brand-700 px-4 text-sm font-medium text-white",
          "hover:bg-brand-800",
          size === "lg" ? "h-10" : "h-8",
        )}
      >
        Tìm
      </button>
    </form>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <circle cx="9" cy="9" r="6" />
      <path d="m13.5 13.5 3.5 3.5" strokeLinecap="round" />
    </svg>
  );
}
