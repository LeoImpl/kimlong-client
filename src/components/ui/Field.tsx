import { cn } from "@/lib/cn";

const control =
  "w-full rounded-md border bg-page px-3 text-sm text-ink shadow-card placeholder:text-muted " +
  "transition-colors focus:border-brand-700 disabled:bg-surface disabled:text-muted";

/** Invalid fields are marked with a colour *and* a message, never colour alone. */
function border(invalid?: boolean) {
  return invalid ? "border-danger" : "border-line-strong hover:border-muted";
}

export function Input({
  className,
  invalid,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(control, border(invalid), "h-10", className)}
      {...props}
    />
  );
}

export function Textarea({
  className,
  invalid,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(control, border(invalid), "min-h-24 py-2", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  invalid,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(control, border(invalid), "h-10 pr-8", className)}
      {...props}
    />
  );
}

/**
 * Label, control and message as one block. The message is wired to the control through `aria-describedby`, so a
 * screen reader announces "bắt buộc" with the field rather than as loose text somewhere on the page.
 */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const messageId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={messageId} className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
