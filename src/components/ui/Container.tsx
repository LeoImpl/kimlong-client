import { cn } from "@/lib/cn";

/** One page width for the whole site, with a 16px gutter that holds down to a 360px phone. */
export function Container({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...props} />
  );
}

export function SectionHeading({
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
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        <h2 className="text-2xl sm:text-[1.75rem] sm:leading-tight">{title}</h2>
        {description && <p className="mt-1 text-body">{description}</p>}
      </div>
      {action}
    </div>
  );
}
