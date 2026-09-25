import { cn } from "@/lib/cn";

/**
 * Wrapper that lets a wide table scroll sideways on a phone instead of squeezing the columns. Engineers read
 * specification tables by scanning a column, so keeping the columns their natural width matters more than fitting.
 */
export function TableWrap({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0", className)}
      {...props}
    />
  );
}

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full border-collapse text-sm", className)} {...props} />;
}

export function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "border-b border-line bg-surface px-3 py-2 text-left text-[13px] font-medium whitespace-nowrap text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("border-b border-line px-3 py-2.5 align-top text-body", className)}
      {...props}
    />
  );
}

/**
 * Specifications as a definition list, not cards: a reader compares values down a column, and cards break that.
 */
/** A body row with the one hover the whole site uses for data rows. */
export function Tr({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors hover:bg-surface", className)} {...props} />;
}

export function SpecList({
  items,
  className,
}: {
  items: { name: string; value: string }[];
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <dl className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((item) => (
        <div
          key={item.name}
          className="grid grid-cols-1 gap-1 px-1 py-2.5 transition-colors hover:bg-surface sm:grid-cols-3 sm:gap-4"
        >
          <dt className="text-[15px] text-muted">{item.name}</dt>
          <dd className="font-mono text-[13px] text-ink sm:col-span-2">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
