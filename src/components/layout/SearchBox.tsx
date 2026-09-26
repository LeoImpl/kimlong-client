"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

/**
 * The most used control on the site. Three things are deliberate:
 *
 * - it is a real `<form method="get" action="/san-pham">`, so it works before hydration and without JavaScript —
 *   which is also how the crawlers see it;
 * - the placeholder names what people actually type — a part number, an order code or a maker — and the search
 *   matches part numbers ignoring separators and case (`dsbc 32 50` finds `DSBC-32-50-PPVA-N3`);
 * - with `shortcut`, "/" focuses it from anywhere, the convention of every data tool a purchasing clerk uses.
 */
export function SearchBox({
  defaultValue = "",
  autoFocus,
  shortcut,
  className,
  size = "md",
  placeholder = "Mã sản phẩm, part number, hãng sản xuất…",
}: {
  defaultValue?: string;
  autoFocus?: boolean;
  shortcut?: boolean;
  className?: string;
  size?: "md" | "lg";
  placeholder?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const input = useRef<HTMLInputElement>(null);
  // The home page renders this twice (header and hero), so the id cannot be a constant.
  const id = useId();

  useEffect(() => {
    if (!shortcut) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      // Never steal the key from a field the visitor is typing in.
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      input.current?.focus();
      input.current?.select();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcut]);

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
        Tìm theo mã sản phẩm, part number hoặc hãng
      </label>
      <input
        ref={input}
        id={id}
        type="search"
        name="q"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className={cn(
          "peer w-full rounded-[5px] border border-line-strong bg-surface pl-10 text-ink",
          "transition-[border-color,background-color,box-shadow] placeholder:text-muted hover:border-muted",
          "focus:border-action-600 focus:bg-page focus:shadow-[0_0_0_3px_var(--color-action-100)] focus:outline-none",
          shortcut ? "pr-28" : "pr-20",
          size === "lg" ? "h-14 pl-11 text-lg" : "h-11 text-[16px]",
        )}
      />
      <Search
        className={cn(
          "pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted",
          size === "lg" ? "size-5" : "size-4",
        )}
        strokeWidth={1.5}
        aria-hidden
      />
      {shortcut && (
        <kbd
          className="pointer-events-none absolute top-1/2 right-17 hidden -translate-y-1/2 rounded border border-line-strong bg-page px-1.5 font-mono text-[12px] text-muted peer-focus:hidden lg:block"
          aria-hidden
        >
          /
        </kbd>
      )}
      <button
        type="submit"
        className={cn(
          "absolute top-1/2 right-1 -translate-y-1/2 rounded-[4px] bg-linear-to-b from-action-500 to-action-600 font-semibold text-white",
          "shadow-[inset_0_1px_0_rgb(255_255_255/0.22),inset_0_-2px_0_rgb(0_0_0/0.14)] transition-colors hover:from-action-600 hover:to-action-700",
          size === "lg" ? "h-12 px-6 text-base" : "h-9 px-4 text-sm",
        )}
      >
        Tìm
      </button>
    </form>
  );
}
