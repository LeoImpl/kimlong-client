import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Joins class names and lets a caller's utility win over a component's default: `cn("px-4", "px-6")` is `px-6`.
 * Without the merge, the two classes would both be emitted and the winner would depend on CSS source order.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
