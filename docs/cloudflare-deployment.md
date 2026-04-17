# Cloudflare Deployment

This project can be deployed to Cloudflare with minimal structural change:

- `apps/web` stays a Next.js app and is deployed to Cloudflare Workers with OpenNext.
- `apps/api` stays a FastAPI app and is wrapped by a thin Worker that forwards requests into a Cloudflare Container.

## Production Domains

Because DNS host labels cannot use underscores, the requested prefix `crypto_signal_lab` is normalized to `crypto-signal-lab`.

- Frontend: `https://crypto-signal-lab.rickyyao.cc`
- Frontend health probe: `https://crypto-signal-lab.rickyyao.cc/api/healthz`
- The production API origin is intentionally omitted from public documentation and is configured privately in deployment settings.

## Paid Plan Requirement

This repository uses Cloudflare Containers for the FastAPI backend. That requires the Cloudflare `Workers Paid` plan on the target account.

- `R2 Paid` on its own is not enough.
- Once `Workers Paid` is enabled, `wrangler containers list` should return successfully.

## One-Time Setup

1. Make sure `rickyyao.cc` is already delegated to the same Cloudflare account you will deploy from.
2. Install Docker Desktop and make sure Docker is running before deploying the API container.
3. Log in to Cloudflare from this repository root:

```bash
cd crypto-signal-lab
npm run cf:login
```

4. Confirm the authenticated account:

```bash
cd crypto-signal-lab
npm run cf:whoami
```

## Frontend Deployment

The frontend uses `apps/web/wrangler.jsonc` and only injects the production API origin in the `production` environment. Local preview continues to use the existing `http://127.0.0.1:8000` fallback.

```bash
cd crypto-signal-lab
npm install --prefix apps/web
npm run deploy:web:cf
```

Useful local preview command:

```bash
cd crypto-signal-lab
npm run preview:web:cf
```

## API Deployment

The API deployment lives in:

- `apps/api/wrangler.jsonc`
- `apps/api/cloudflare/worker.mjs`

The Worker keeps a single named FastAPI container warm and forwards incoming requests to it.

Before deploying, write any private factor keys into Worker secrets. The Worker now forwards
those secrets into the FastAPI container as environment variables.

```bash
cd crypto-signal-lab
npm install --prefix apps/api
printf '%s' 'your_fred_key' | npm --prefix apps/api exec wrangler secret put CSL_FRED_API_KEY --env production
printf '%s' 'your_glassnode_key' | npm --prefix apps/api exec wrangler secret put CSL_GLASSNODE_API_KEY --env production
printf '%s' 'your_sosovalue_key' | npm --prefix apps/api exec wrangler secret put CSL_SOSOVALUE_API_KEY --env production
npm run deploy:api:cf
```

To deploy both services in the correct order:

```bash
cd crypto-signal-lab
npm run deploy:cf
```

## Monitoring And Operations

Tail live frontend logs:

```bash
cd crypto-signal-lab
npm run tail:web:cf
```

Tail live API logs:

```bash
cd crypto-signal-lab
npm run tail:api:cf
```

Public health checks:

```bash
curl -fsS https://crypto-signal-lab.rickyyao.cc/api/healthz
```

Market data smoke test:

```bash
curl -fsS "https://crypto-signal-lab.rickyyao.cc/api/v1/market/watchlist?source=binance-spot&timeframe=1d&strategy=ema-regime"
```

## Production Defaults

- The frontend ships canonical metadata, sitemap, robots, and OG/Twitter cards.
- `/api/v1/market/watchlist`, `/api/v1/market/replay`, and `/api/v1/market/leaderboard` now send CDN-friendly cache headers for short-term edge caching.
- The frontend health route checks the backend and returns `503` if the API is unavailable.

## Notes

- Cloudflare Containers requires Docker during `wrangler deploy` when the image comes from a local `Dockerfile`.
- If you later want a staging environment, add another Wrangler environment with a different route and API origin.
- The frontend and backend can be deployed independently, but the frontend production route expects `CSL_API_BASE_URL` to point at your private API origin.
