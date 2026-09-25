import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "dark" | "accent" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-[color,background-color,border-color,transform] duration-150 " +
  "active:scale-[0.98] " +
  "disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap [&_svg]:shrink-0";

const variants: Record<Variant, string> = {
  // Industrial blue: the one element on a page meant to be pressed.
  primary: "bg-action-600 text-white hover:bg-action-700 active:bg-action-800",
  // Graphite, for a second strong action next to a blue one, or on a light band where blue would compete.
  dark: "bg-navy text-white hover:bg-navy-hover",
  // Brass, for the single most important action where graphite would disappear (on a dark ground).
  accent: "bg-brand-300 text-ink hover:bg-brand-200 active:bg-brand-400",
  secondary:
    "border border-line-strong bg-page text-ink hover:border-muted hover:bg-surface active:bg-line",
  ghost: "text-action-600 hover:bg-action-50 active:bg-action-100",
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
