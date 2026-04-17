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

Optional external factors for `jiayi-four-factor`:

- `Alternative.me Fear & Greed API` is enabled by default and does not need a key
- `CSL_GLASSNODE_API_KEY` for `MVRV Z-Score`, `aSOPR`, and `BTC spot ETF net flows`
- `CSL_SOSOVALUE_API_KEY` for `BTC / ETH spot ETF net flows` via SoSoValue
- `CSL_FRED_API_KEY` for macro regime inputs based on `M2SL` and `FEDFUNDS`
- `CSL_FACTOR_CACHE_TTL_SECONDS` to control the in-process cache window, default `900`

These external factors are currently wired into `jiayi-four-factor`, with on-chain data focused on `BTCUSDT`
and spot ETF flows available for `BTCUSDT` and `ETHUSDT` when the relevant key is present.
If the keys are missing, the strategy still runs and falls back to OHLCV-based proxy factors.

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

Recommended local secret file for the API:

```bash
cd crypto-signal-lab/apps/api
cat > .env.local <<'EOF'
CSL_GLASSNODE_API_KEY=your_glassnode_key
CSL_SOSOVALUE_API_KEY=your_sosovalue_key
CSL_FRED_API_KEY=your_fred_key
EOF
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

Before deploying the API, set any private factor keys as Cloudflare Worker secrets:

```bash
cd crypto-signal-lab/apps/api
printf '%s' 'your_fred_key' | npx wrangler secret put CSL_FRED_API_KEY --env production
printf '%s' 'your_glassnode_key' | npx wrangler secret put CSL_GLASSNODE_API_KEY --env production
printf '%s' 'your_sosovalue_key' | npx wrangler secret put CSL_SOSOVALUE_API_KEY --env production
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
