import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch, apiFetchOrNull } from "./client";
import { ApiError } from "./problem";

/** Captures what the client sent, and replies with whatever the test asks for. */
function stubFetch(reply: { status: number; body?: unknown }) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url: String(url), init });
      return new Response(reply.body === undefined ? "" : JSON.stringify(reply.body), {
        status: reply.status,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Awaits a call that must fail, and hands back the ApiError with its type intact. */
async function expectApiError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    return error as ApiError;
  }
  throw new Error("Expected the request to fail, but it resolved.");
}

describe("apiFetch", () => {
  it("sends Accept-Language and a correlation id on every request", async () => {
    const calls = stubFetch({ status: 200, body: [] });

    await apiFetch("/api/public/v1/catalog/categories");

    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers["Accept-Language"]).toBe("vi");
    expect(headers["X-Correlation-Id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("drops empty query values instead of sending blank parameters", async () => {
    const calls = stubFetch({ status: 200, body: { items: [] } });

    await apiFetch("/api/public/v1/catalog/products", {
      query: { q: "loc dau", category: undefined, brand: "", page: 0 },
    });

    const url = new URL(calls[0].url);
    expect(url.searchParams.get("q")).toBe("loc dau");
    expect(url.searchParams.has("category")).toBe(false);
    expect(url.searchParams.has("brand")).toBe(false);
    // page=0 is meaningful and must survive, even though it is falsy.
    expect(url.searchParams.get("page")).toBe("0");
  });

  it("turns a problem detail into an ApiError that keeps code and correlation id", async () => {
    stubFetch({
      status: 404,
      body: {
        status: 404,
        detail: "Product khong-ton-tai does not exist.",
        code: "catalog.product-not-found",
        correlationId: "27de3002-9e93-489d-87b3-d182be642c53",
      },
    });

    const error = await expectApiError(apiFetch("/api/public/v1/catalog/products/khong-ton-tai"));

    expect(error.status).toBe(404);
    expect(error.code).toBe("catalog.product-not-found");
    expect(error.correlationId).toBe("27de3002-9e93-489d-87b3-d182be642c53");
    expect(error.isNotFound).toBe(true);
  });

  it("flags the submission rate limit, which the UI answers with a phone number", async () => {
    stubFetch({ status: 429, body: { status: 429, code: "inquiry.rate-limited" } });

    const error = await expectApiError(apiFetch("/api/public/v1/quote-requests", { body: {} }));

    expect(error.isRateLimited).toBe(true);
  });

  it("reports an unreachable API as status 0, not as a normal failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );

    const error = await expectApiError(apiFetch("/api/public/v1/catalog/categories"));

    expect(error.status).toBe(0);
  });

  it("still parses an error body that is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html>502 Bad Gateway</html>", { status: 502 })),
    );

    const error = await expectApiError(apiFetch("/api/public/v1/catalog/categories"));

    expect(error.status).toBe(502);
    expect(error.message).toContain("502");
  });
});

describe("apiFetchOrNull", () => {
  it("returns null for 404 so a page can render its own not-found", async () => {
    stubFetch({ status: 404, body: { status: 404, code: "catalog.product-not-found" } });

    await expect(apiFetchOrNull("/api/public/v1/catalog/products/nope")).resolves.toBeNull();
  });

  it("still throws for failures that are not 404", async () => {
    stubFetch({ status: 500, body: { status: 500 } });

    await expect(apiFetchOrNull("/api/public/v1/catalog/products/x")).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
