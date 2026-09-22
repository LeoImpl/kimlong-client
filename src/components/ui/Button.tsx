import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "accent" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors " +
  "disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap [&_svg]:shrink-0";

const variants: Record<Variant, string> = {
  primary: "bg-navy text-white shadow-card hover:bg-navy-hover active:bg-navy",
  accent: "bg-brand-900 text-white shadow-card hover:bg-brand-800 active:bg-brand-900",
  secondary:
    "border border-line-strong bg-page text-ink shadow-card hover:bg-surface active:bg-line",
  ghost: "text-brand-700 hover:bg-brand-50 active:bg-brand-100",
  danger: "bg-danger text-white hover:brightness-110",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}

/**
 * A link that looks like a button. Kept in the same file as [Button] so the two never drift apart — most calls to
 * action on this site navigate (to the product, to the quote form) rather than submit.
 */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
