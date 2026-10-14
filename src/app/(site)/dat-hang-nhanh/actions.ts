"use server";

import { lookupPartNumbers, MAX_PART_NUMBER_LOOKUP } from "@/lib/api/catalog";
import type { PartNumberMatch } from "@/lib/api/types";

export type LookupResult = { ok: true; matches: PartNumberMatch[] } | { ok: false };

/**
 * Resolves the quick order grid's part numbers on the server, so the browser still never talks to the catalogue
 * API directly (no public CORS, the API host stays private). A server action is a public POST endpoint, so the
 * input is checked here as untrusted, whatever the grid already enforces.
 */
export async function resolvePartNumbers(input: unknown): Promise<LookupResult> {
  if (!Array.isArray(input)) return { ok: false };
  const partNumbers = [
    ...new Set(
      input
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter((value) => value.length > 0 && value.length <= 64),
    ),
  ].slice(0, MAX_PART_NUMBER_LOOKUP);

  try {
    return { ok: true, matches: await lookupPartNumbers(partNumbers) };
  } catch {
    // The grid degrades to "not checked": every line can still be sent, and sales resolve it by hand.
    return { ok: false };
  }
}
