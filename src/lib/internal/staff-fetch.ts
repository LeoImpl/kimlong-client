import "server-only";
import { apiFetch, type RequestOptions } from "@/lib/api/client";
import { ApiError } from "@/lib/api/problem";
import { requireStaff } from "./session";

/**
 * Calls the platform's admin zone as the signed-in salesperson. Server only: the browser never holds the token
 * and never learns the API host, so the internal area needs no CORS either.
 *
 * Nothing here is cached (`use cache` is for the public catalogue): the data is private to one salesperson and
 * changes as they work.
 */
export async function staffFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const session = await requireStaff();
  return apiFetch<T>(path, {
    ...options,
    init: {
      ...options.init,
      cache: "no-store",
      headers: {
        ...(options.init?.headers as Record<string, string> | undefined),
        Authorization: `Bearer ${session.accessToken}`,
      },
    },
  });
}

/** `null` instead of an error for a record that does not exist — or belongs to another salesperson (also 404). */
export async function staffFetchOrNull<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T | null> {
  try {
    return await staffFetch<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}

export const SALES_API = "/api/admin/v1/sales";
