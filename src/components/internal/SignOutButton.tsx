import { LogOut } from "lucide-react";
import { cn } from "@/lib/cn";
import { AUTH_LOGOUT_PATH } from "@/lib/internal/tokens";

/** A real form POST, so signing out works without JavaScript and cannot be triggered by a link. */
export function SignOutButton({
  label = "Đăng xuất",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <form action={AUTH_LOGOUT_PATH} method="post">
      <button
        type="submit"
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-md border border-line-strong bg-page px-3 text-sm font-medium text-ink transition-colors hover:border-action-500 hover:text-action-700",
          className,
        )}
      >
        <LogOut className="size-4" strokeWidth={1.75} aria-hidden />
        {label}
      </button>
    </form>
  );
}
