import type { NextConfig } from "next";

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
