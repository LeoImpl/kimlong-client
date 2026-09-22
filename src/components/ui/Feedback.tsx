import { cn } from "@/lib/cn";

/** Placeholder while server-rendered content streams in. Purely decorative, so hidden from assistive tech. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-line", className)} aria-hidden />;
}

/**
 * Nothing to show. Always offers a way out — on a catalogue this small, "không tìm thấy" without a next step is
 * where an enquiry is lost.
 */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-line-strong bg-page px-6 py-12 text-center",
        className,
      )}
    >
      <p className="text-base font-medium text-ink">{title}</p>
      {description && <p className="mx-auto mt-1.5 max-w-md text-sm text-body">{description}</p>}
      {action && <div className="mt-5 flex justify-center gap-3">{action}</div>}
    </div>
  );
}

type Tone = "info" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  info: "border-brand-200 bg-brand-50 text-brand-900",
  success: "border-success/20 bg-success-soft text-success",
  warning: "border-warning/20 bg-warning-soft text-warning",
  danger: "border-danger/20 bg-danger-soft text-danger",
};

/**
 * An inline message. `danger` and `warning` announce themselves, because they usually appear after a submission
 * failed and the visitor's focus is still on the button they pressed.
 */
export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const assertive = tone === "danger" || tone === "warning";
  return (
    <div
      role={assertive ? "alert" : "status"}
      className={cn("rounded-md border px-4 py-3 text-sm", tones[tone], className)}
    >
      {title && <p className="font-medium">{title}</p>}
      {children && <div className={cn(title && "mt-1")}>{children}</div>}
    </div>
  );
}
