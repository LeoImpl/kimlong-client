"use client";

import { useEffect, useState } from "react";
import { AUTH_KEEPALIVE_PATH, LOGIN_PATH } from "@/lib/internal/tokens";

/** Well inside Keycloak's five-minute access token and thirty-minute idle timeout. */
const INTERVAL_MS = 4 * 60 * 1000;

/**
 * Keeps the session alive while the tab is open, and says so when it could not: the salesperson may be halfway
 * through a quotation, so the page is left as it is and the login opens in a new tab.
 */
export function SessionKeepAlive() {
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function ping() {
      if (document.visibilityState === "hidden") return;
      try {
        const response = await fetch(AUTH_KEEPALIVE_PATH, { cache: "no-store" });
        if (!cancelled) setExpired(response.status === 401);
      } catch {
        // Offline for a moment: the next tick tries again.
      }
    }
    const timer = setInterval(ping, INTERVAL_MS);
    document.addEventListener("visibilitychange", ping);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", ping);
    };
  }, []);

  if (!expired) return null;
  return (
    <div
      role="alert"
      className="fixed inset-x-0 bottom-0 z-50 flex flex-wrap items-center justify-center gap-3 border-t border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning"
    >
      <span>Phiên đăng nhập đã hết hạn. Dữ liệu đang nhập vẫn còn trên trang này.</span>
      <a
        href={LOGIN_PATH}
        target="_blank"
        rel="noreferrer"
        className="font-semibold underline underline-offset-2"
      >
        Đăng nhập lại ở tab mới
      </a>
      <button
        type="button"
        className="font-semibold underline underline-offset-2"
        onClick={() => setExpired(false)}
      >
        Đã đăng nhập xong
      </button>
    </div>
  );
}
