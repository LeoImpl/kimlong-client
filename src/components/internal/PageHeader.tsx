import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export interface Crumb {
  label: string;
  href?: string;
}

/** Title row of an internal page: where you are, what it is, and the one or two things you can do here. */
export function PageHeader({
  title,
  description,
  crumbs,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  crumbs?: Crumb[];
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-5", className)}>
      {crumbs && crumbs.length > 0 && (
        <nav
          aria-label="Đường dẫn"
          className="mb-1.5 flex flex-wrap items-center gap-1 text-xs text-muted"
        >
          {crumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="size-3.5" strokeWidth={1.5} aria-hidden />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-action-700 hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[1.75rem] leading-tight">{title}</h1>
          <span className="internal-title-rule mt-1.5 block h-1 w-14 rounded-full" aria-hidden />
          {description && <p className="mt-2 text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** A white panel: the internal area's unit of content, lifted off the coloured canvas by a soft shadow. */
export function Panel({
  title,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("internal-panel rounded-lg border border-line bg-page", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          {title && (
            <h2 className="flex items-center gap-2 text-lg">
              <span
                className="h-4 w-1 rounded-full bg-linear-to-b from-action-500 to-[#06b6d4]"
                aria-hidden
              />
              {title}
            </h2>
          )}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}
