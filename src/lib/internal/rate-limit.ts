/**
 * A small fixed-window limiter for the login endpoints, kept in this process's memory.
 *
 * Passwords are typed at Keycloak, which has its own brute-force protection; this only stops one address from
 * hammering the login start and callback (each start costs a discovery lookup and a sealed cookie, each callback a
 * token exchange). One Next process serves the internal area, so per-process state is enough; behind several
 * instances the limit is simply per instance.
 */
export interface RateLimiter {
  /** Counts one attempt for `key` and answers whether it is still within the limit. */
  allow(key: string, now?: number): boolean;
}

export function createRateLimiter(
  maxAttempts: number,
  windowMs: number,
  maxKeys = 10_000,
): RateLimiter {
  const windows = new Map<string, { startedAt: number; count: number }>();
  return {
    allow(key, now = Date.now()) {
      const current = windows.get(key);
      if (!current || now - current.startedAt >= windowMs) {
        if (windows.size >= maxKeys) {
          // Never grow without bound: drop expired windows, and everything if that was not enough.
          for (const [stored, window] of windows) {
            if (now - window.startedAt >= windowMs) windows.delete(stored);
          }
          if (windows.size >= maxKeys) windows.clear();
        }
        windows.set(key, { startedAt: now, count: 1 });
        return true;
      }
      current.count += 1;
      return current.count <= maxAttempts;
    },
  };
}

/** The caller's address as the reverse proxy reports it; one shared bucket when there is none. */
export function clientAddress(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

/** 20 login attempts per address every 5 minutes: far above what a person does, far below what a script does. */
export const loginLimiter = createRateLimiter(20, 5 * 60 * 1000);
