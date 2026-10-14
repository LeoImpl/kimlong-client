import { describe, expect, it } from "vitest";
import { clientAddress, createRateLimiter } from "./rate-limit";

describe("login rate limiter", () => {
  it("allows the limit per window and address, then refuses until the window ends", () => {
    const limiter = createRateLimiter(3, 1000);
    expect([1, 2, 3, 4, 5].map(() => limiter.allow("a", 0))).toEqual([
      true,
      true,
      true,
      false,
      false,
    ]);
    expect(limiter.allow("b", 0)).toBe(true);
    expect(limiter.allow("a", 999)).toBe(false);
    expect(limiter.allow("a", 1000)).toBe(true);
  });

  it("does not grow without bound", () => {
    const limiter = createRateLimiter(1, 1000, 100);
    for (let index = 0; index < 1000; index++) limiter.allow(`address-${index}`, 0);
    // Still answers, and a new address after the purge starts a fresh window.
    expect(limiter.allow("late", 0)).toBe(true);
    expect(limiter.allow("late", 1)).toBe(false);
  });

  it("reads the first forwarded address", () => {
    expect(clientAddress(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe(
      "203.0.113.7",
    );
    expect(clientAddress(new Headers({ "x-real-ip": "203.0.113.8" }))).toBe("203.0.113.8");
    expect(clientAddress(new Headers())).toBe("unknown");
  });
});
