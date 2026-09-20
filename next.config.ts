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

  images: {
    remotePatterns: [
      {
        protocol: mediaOrigin.protocol.replace(":", "") as "http" | "https",
        hostname: mediaOrigin.hostname,
        port: mediaOrigin.port || undefined,
        pathname: "/api/public/v1/media/**",
      },
    ],
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
