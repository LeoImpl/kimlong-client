import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "dark" | "accent" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

/**
 * Buttons are pressed metal, not flat paint: a faint top highlight, a one-pixel darker lip at the bottom and a
 * shadow that grows on hover, so the one thing meant to be pressed stands off the white plates around it. The
 * press itself sinks the button (the lip disappears), which reads as a physical click. An arrow icon (lucide's
 * `ArrowRight`) nudges forward on hover, the site's "go on" cue.
 */
const base =
  "relative inline-flex items-center justify-center gap-2 rounded-[5px] font-semibold tracking-[0.01em] " +
  "transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out " +
  "hover:-translate-y-px active:translate-y-px " +
  "disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none whitespace-nowrap [&_svg]:shrink-0 " +
  "[&_.lucide-arrow-right]:transition-transform [&_.lucide-arrow-right]:duration-200 hover:[&_.lucide-arrow-right]:translate-x-0.5";

/** Top highlight and bottom lip shared by the solid variants; the colour of the drop shadow is the variant's. */
const solid =
  "shadow-[inset_0_1px_0_rgb(255_255_255/0.22),inset_0_-2px_0_rgb(0_0_0/0.14),0_1px_2px_rgb(28_34_39/0.18)] " +
  "active:shadow-[inset_0_1px_2px_rgb(0_0_0/0.2)]";

const variants: Record<Variant, string> = {
  // Industrial blue: the one element on a page meant to be pressed.
  primary:
    `${solid} bg-linear-to-b from-action-500 to-action-600 text-white ` +
    "hover:from-action-600 hover:to-action-700 hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.22),inset_0_-2px_0_rgb(0_0_0/0.14),0_8px_18px_-8px_rgb(31_90_171/0.7)]",
  // Graphite, for a second strong action next to a blue one, or on a light band where blue would compete.
  dark:
    `${solid} bg-linear-to-b from-navy-hover to-navy text-white ` +
    "hover:from-navy hover:to-navy hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.18),inset_0_-2px_0_rgb(0_0_0/0.2),0_8px_18px_-8px_rgb(28_34_39/0.7)]",
  // Brass, for the single most important action where graphite would disappear (on a dark ground). Polished:
  // lighter at the top like a machined plate catching the light.
  accent:
    `${solid} border border-brand-500 bg-linear-to-b from-brand-200 to-brand-300 text-ink ` +
    "hover:from-brand-100 hover:to-brand-200 hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.5),inset_0_-2px_0_rgb(0_0_0/0.1),0_8px_18px_-8px_rgb(168_123_42/0.8)]",
  secondary:
    "border border-line-strong bg-page text-ink shadow-[0_1px_0_rgb(28_34_39/0.06)] " +
    "hover:border-action-500 hover:text-action-700 hover:shadow-[0_6px_14px_-8px_rgb(31_90_171/0.45)] active:bg-action-50",
  ghost: "text-action-600 hover:bg-action-50 hover:text-action-700 active:bg-action-100",
  danger: `${solid} bg-danger text-white hover:brightness-110`,
};

// md and lg meet the 44px touch target; sm is for dense rows (tables, cards) where a row is the target.
const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
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
