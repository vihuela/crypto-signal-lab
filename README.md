# Crypto Signal Lab

Local-first crypto research terminal for strategy exploration, historical replay, and AI-assisted directional signals.

Production deployment is live on Cloudflare:

- App: `https://crypto-signal-lab.rickyyao.cc`
- Frontend health probe: `https://crypto-signal-lab.rickyyao.cc/api/healthz`

## Workspace Layout

- `apps/web` — Next.js front-end for the research dashboard
- `apps/api` — FastAPI orchestration layer for market data, strategies, and backtests
- `packages/contracts` — shared API contract notes and future generated clients
- `docs` — product and technical notes
- `infra` — local Docker and deployment scaffolding

## Current Scope

- Spot markets only
- Default assets: `BTC`, `ETH`, `SOL`, `DOGE`
- Default sources: `Binance`, `Bybit`
- Timeframes: `1d`, `1w`
- Local deployment only
- No live trading in V1

## Local Development

### Web

```bash
cd crypto-signal-lab
npm run dev:web
```

### API

```bash
cd crypto-signal-lab
npm run bootstrap:api
npm run dev:api
```

### Batch Backtests

```bash
cd crypto-signal-lab
npm run backtest:api
```

To force a single exchange source for the full batch:

```bash
cd crypto-signal-lab/apps/api
.venv/bin/python scripts/run_strategy_benchmarks.py --source-override binance-spot
```

## Docker

```bash
cd crypto-signal-lab/infra
docker compose up --build
```

## Cloudflare Deployment

Cloudflare deployment scaffolding now exists for both apps:

- `apps/web` uses OpenNext on Workers
- `apps/api` uses a thin Worker plus Cloudflare Containers

Deploy both services in production order:

```bash
cd crypto-signal-lab
npm run deploy:cf
```

Tail production logs:

```bash
cd crypto-signal-lab
npm run tail:api:cf
npm run tail:web:cf
```

Quick production checks:

```bash
curl -fsS https://crypto-signal-lab.rickyyao.cc/api/healthz
curl -fsS "https://crypto-signal-lab.rickyyao.cc/api/v1/market/watchlist?source=binance-spot&timeframe=1d&strategy=ema-regime"
```

See [`docs/cloudflare-deployment.md`](docs/cloudflare-deployment.md) for the full setup, paid-plan note, health checks, and operations guide.

## Next Milestones

1. Replace mock market payloads with exchange-backed historical candles.
2. Wire strategy execution to Freqtrade and add a strategy adapter layer.
3. Add AI forecast jobs for `1d` directional confidence on top assets.
4. Persist backtest runs and replay snapshots in Postgres.
