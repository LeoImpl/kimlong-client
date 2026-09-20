import { env } from "@/lib/env";
import { ApiError, type ProblemDetail } from "./problem";

/**
 * Single entry point to the platform API.
 *
 * Two things every call gets:
 *  - `Accept-Language`, so the API resolves LocalizedText for us (`vi` in v1, see decision D5);
 *  - `X-Correlation-Id`, so a failure a user reports can be found in the backend log. The platform echoes it back
 *    in the problem detail.
 *
 * Caching is deliberately NOT handled here. In Next 16 `fetch` is uncached by default, and catalogue reads opt in
 * through `use cache` in `catalog.ts`. Keeping the transport dumb means the submission path stays uncached without
 * any special casing.
 */

export interface RequestOptions {
  /** Query string values; `undefined` and `null` entries are dropped. */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** JSON request body. Presence of this switches the method to POST unless `method` says otherwise. */
  body?: unknown;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  /** Base URL override. Defaults to the server-side API base; the browser must pass the public one. */
  baseUrl?: string;
  signal?: AbortSignal;
  /** Extra fetch options, e.g. Next's `next: { tags: [...] }`. */
  init?: RequestInit;
}

function buildUrl(path: string, query: RequestOptions["query"], baseUrl: string): string {
  const url = new URL(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function newCorrelationId(): string {
  return crypto.randomUUID();
}

async function readProblem(response: Response): Promise<ProblemDetail | undefined> {
  try {
    const text = await response.text();
    if (!text) return undefined;
    return JSON.parse(text) as ProblemDetail;
  } catch {
    // A proxy or gateway error may not be JSON at all.
    return undefined;
  }
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = options.baseUrl ?? env.apiBaseUrl;
  const method = options.method ?? (options.body !== undefined ? "POST" : "GET");
  const correlationId = newCorrelationId();

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-Language": env.language,
    "X-Correlation-Id": correlationId,
    ...(options.init?.headers as Record<string, string> | undefined),
  };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query, baseUrl), {
      ...options.init,
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (cause) {
    // The API being unreachable is a different problem from the API saying no, and the UI treats it differently.
    throw new ApiError(
      `Could not reach the API at ${baseUrl}${path} (correlationId ${correlationId})`,
      0,
      { status: 0, correlationId },
      // Keeps the underlying DNS/TLS/connection error, which is what actually says why it failed.
      { cause },
    );
  }

  if (!response.ok) {
    const problem = await readProblem(response);
    throw new ApiError(
      problem?.detail ?? `${method} ${path} failed with ${response.status}`,
      response.status,
      {
        ...problem,
        status: response.status,
        correlationId: problem?.correlationId ?? correlationId,
      },
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** Returns `null` instead of throwing when the resource does not exist, for pages that render a 404. */
export async function apiFetchOrNull<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T | null> {
  try {
    return await apiFetch<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}
