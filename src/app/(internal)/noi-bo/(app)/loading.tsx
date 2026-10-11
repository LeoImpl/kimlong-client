import { Skeleton } from "@/components/ui/Feedback";

/**
 * Shown while an internal page reads the session and its data: on the first load as part of the static frame, and
 * on every navigation between internal pages, so a click always answers at once.
 */
export default function InternalLoading() {
  return (
    <div className="space-y-4" aria-busy>
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
