import { Alert } from "@/components/ui/Feedback";
import type { ActionResult } from "@/lib/internal/action-result";

/** Why an action failed, with the code that ties a salesperson's report to the backend log. */
export function FormMessage({
  result,
  className,
}: {
  result: ActionResult<unknown> | null | undefined;
  className?: string;
}) {
  if (!result || result.ok) return null;
  return (
    <Alert tone="danger" className={className}>
      <p>{result.message}</p>
      {result.correlationId && (
        <p className="mt-1 font-mono text-xs opacity-80">Mã tra cứu: {result.correlationId}</p>
      )}
    </Alert>
  );
}
