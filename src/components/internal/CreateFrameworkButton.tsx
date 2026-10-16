"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FilePlus2 } from "lucide-react";
import { createPaperAction } from "@/app/(internal)/noi-bo/(app)/chung-tu/actions";
import { FormMessage } from "@/components/internal/FormMessage";
import { Button } from "@/components/ui/Button";
import type { ActionResult } from "@/lib/internal/action-result";
import { internalRoutes } from "@/lib/internal/routes";

/** Starts a framework contract for the customer from the standard text and opens it. */
export function CreateFrameworkButton({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<{ id: string }> | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const response = await createPaperAction({ kind: "FRAMEWORK_CONTRACT", customerId });
            setResult(response);
            if (response.ok) router.push(internalRoutes.paper(response.data.id));
          })
        }
      >
        <FilePlus2 className="size-4" strokeWidth={1.75} aria-hidden />
        Tạo hợp đồng nguyên tắc
      </Button>
      <FormMessage result={result} />
    </div>
  );
}
