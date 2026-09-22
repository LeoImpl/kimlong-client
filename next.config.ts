import type { NextConfig } from "next";
import { HTML_LIMITED_BOTS } from "./src/lib/crawlers";

/**
 * The API host is only known at runtime, so image URLs are validated from the same environment variable the API
 * client uses. Media is served by the platform (`/api/public/v1/media/{id}/content`), never from S3 directly,
 * because the bucket is private.
 */
const mediaOrigin = new URL(
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? process.env.API_BASE_URL ?? "http://localhost:8080",
);

const nextConfig: NextConfig = {
  // Builds a self-contained server bundle, so the production image does not need node_modules.
  output: "standalone",

  // Cache Components: catalogue reads opt in with `use cache` (see src/lib/api/catalog.ts). Without this,
  // fetch is uncached in Next 16 and every page view would hit the API.
  cacheComponents: true,

  /**
   * Render metadata before the HTML starts streaming for crawlers that read `<head>` without running JavaScript.
   *
   * By default Next streams `<title>`, the description and the Open Graph tags after `</head>`, except for a
   * built-in list of crawlers. Zalo's link preview crawler is not on that list, so a product shared by a sales
   * rep on Zalo showed a bare link; `HTML_LIMITED_BOTS` adds it (and a few other Vietnamese crawlers).
   *
   * It must never match a real browser. This used to be `/.*\/` (every user agent), which made Next render
   * prefetches in full and the client router reuse the last prefetched product for every product link — see
   * src/lib/crawlers.ts.
   */
  htmlLimitedBots: HTML_LIMITED_BOTS,

  images: {
    // Product photos are large PNG scans of packaging. AVIF is typically 40% smaller than the WebP the
    // optimizer would otherwise serve, and the product image is the largest element on a product page.
    formats: ["image/avif", "image/webp"],
  },

  /**
   * Images keep the same-origin path the API returns (`/api/public/v1/media/{id}/content`) and are proxied to
   * the platform from here. That keeps decision D8 intact — the browser never learns the API host, not even in
   * the image optimizer's query string — and lets `next/image` treat them as local images. The responses carry a
   * SHA-256 ETag and `immutable, max-age=31536000`, so the hop is cached away almost entirely.
   */
  async rewrites() {
    return [
      {
        source: "/api/public/v1/media/:path*",
        destination: `${mediaOrigin.origin}/api/public/v1/media/:path*`,
      },
    ];
  },

  // The platform already sets its own security headers; these cover the pages this app serves.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
