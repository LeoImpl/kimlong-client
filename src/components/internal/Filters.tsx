import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Filters of a list page: a plain GET form, so the filtered list is a URL that can be bookmarked and shared, and
 * it works before any JavaScript has loaded.
 */
export function FilterBar({
  action,
  children,
  className,
}: {
  action: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <form
      action={action}
      method="get"
      className={cn(
        "internal-panel mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-line bg-page p-3",
        className,
      )}
    >
      {children}
      <button
        type="submit"
        className="inline-flex h-10 items-center gap-2 rounded-md bg-linear-to-r from-action-500 to-[#06b6d4] px-4 text-sm font-semibold text-white shadow-[0_6px_16px_-8px_rgb(37_99_235/0.85)] transition-[filter,transform] hover:-translate-y-px hover:brightness-110"
      >
        <Search className="size-4" strokeWidth={1.75} aria-hidden />
        Lọc
      </button>
    </form>
  );
}

const control =
  "h-10 rounded-md border border-line-strong bg-page px-3 text-sm text-ink placeholder:text-muted " +
  "transition-colors hover:border-muted focus:border-action-600";

export function FilterField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

export function FilterInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(control, "w-full", props.className)} />;
}

export function FilterSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(control, "w-full pr-8", props.className)} />;
}
