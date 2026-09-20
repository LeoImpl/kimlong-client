# kimlong-client

Public B2B storefront for the Kim Long platform: customers find industrial parts by name or part number, then
send a quote request. Next.js (App Router) + TypeScript + Tailwind.

Plan and progress live in the workspace: `.claude/docs/client-plan.md`, `.claude/docs/client-progress.md`.

## Why server rendering

Buyers arrive by searching a part number on Google, and sales share product links on Zalo. Google's renderer is a
second, delayed pass, and the Zalo and Facebook crawlers run no JavaScript at all — so a client-only SPA would show
an empty page to the first and a bare link to the second. Pages are therefore rendered on the server.

## Running it

The platform API must be running first (see `../kimlong-platform`):

```bash
cd ../kimlong-platform && docker compose up -d && ./gradlew :platform-app:bootRun
```

Then:

```bash
cp .env.example .env.local     # defaults already point at localhost:8080
npm install
npm run dev                    # http://localhost:3000
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and serve |
| `npm test` | Unit tests (Vitest); no API needed |
| `npm run smoke` | Checks this app can read real catalogue data from a running API |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` / `npm run format` | ESLint / Prettier |
| `npm run gen:api` | Regenerates `src/types/api.ts` from the API's OpenAPI document |

## Configuration

All configuration is environment variables, so one image runs anywhere (see `.env.example`).

| Variable | Used by | Notes |
|---|---|---|
| `API_BASE_URL` | server | Never exposed to the browser, so no CORS is needed for catalogue reads |
| `NEXT_PUBLIC_API_BASE_URL` | browser | Only the quote request submission. Must be in the API's `CORS_ALLOWED_ORIGINS` |
| `NEXT_PUBLIC_SITE_URL` | metadata, sitemap | The single canonical domain in production |
| `NEXT_PUBLIC_LANGUAGE` | API client | `Accept-Language`; `vi` in v1 |

`NEXT_PUBLIC_*` values are baked into the browser bundle at build time, which is why the Dockerfile takes them as
build arguments rather than runtime environment.

## How data loading works

Next 16 does not cache `fetch` by default. Catalogue reads opt in explicitly in `src/lib/api/catalog.ts` using the
`use cache` directive with a `cacheLife` profile and a `cacheTag`, so they can be invalidated per product once an
admin UI exists. Product search is deliberately uncached: `?q=` is unbounded user input.

Pages call `connection()` before cached catalogue data. That stops build-time prerendering, so **`next build` does
not need a reachable API** — important because CI and image builds should not depend on the backend being up, and a
backend blip should never fail a deploy. The first request fills the cache instead.

`src/types/api.ts` is generated from the platform's OpenAPI document and must not be edited by hand. The ergonomic
types in `src/lib/api/types.ts` are derived from it, so an API change breaks the build rather than turning into
`undefined` in production.

## Container

```bash
docker build -t kimlong-client .
docker run -p 3000:3000 -e API_BASE_URL=http://host.docker.internal:8080 kimlong-client
```

`docker-compose.yml` runs it on the platform's Docker network instead, reaching the API directly at `http://app:8080`.

> The Node base image is Debian slim rather than Alpine: the macOS-generated `package-lock.json` omits the
> `@emnapi/*` packages that the wasm fallbacks of Tailwind and sharp need on Linux, and the lock is regenerated in
> a Linux container (`docker run --rm -v "$PWD":/app -w /app node:24-slim npm install --package-lock-only`) so
> `npm ci` works on both.
