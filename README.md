# Crypto Signal Lab

Local-first crypto research terminal for strategy exploration, historical replay, and AI-assisted directional signals.

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
cd /Users/rickyyao/personal/crypto-signal-lab
npm run dev:web
```

### API

```bash
cd /Users/rickyyao/personal/crypto-signal-lab
npm run bootstrap:api
npm run dev:api
```

## Docker

```bash
cd /Users/rickyyao/personal/crypto-signal-lab/infra
docker compose up --build
```

## Next Milestones

1. Replace mock market payloads with exchange-backed historical candles.
2. Wire strategy execution to Freqtrade and add a strategy adapter layer.
3. Add AI forecast jobs for `1d` directional confidence on top assets.
4. Persist backtest runs and replay snapshots in Postgres.
