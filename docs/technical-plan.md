# Technical Plan

## Product Goal

Build a local research terminal for spot crypto analysis that blends:

- multi-asset historical charting
- source-aware data provenance
- strategy selection and backtest replay
- AI-assisted directional guidance

The first version is for single-user local operation and emphasizes visual polish, interpretability, and clean system boundaries.

## Architecture

### apps/web

Owns:

- dashboard UI
- chart replay experience
- strategy comparison surfaces
- data source provenance panels
- local operator workflows

### apps/api

Owns:

- exchange adapters
- data normalization
- strategy catalog and execution orchestration
- backtest job dispatch
- AI forecast job dispatch
- API responses tailored for the dashboard

### packages/contracts

Owns:

- response shape notes
- future generated clients and shared schemas

### infra

Owns:

- Docker compose
- local service topology

## Planned Integrations

- Historical market data: Binance spot, Bybit spot
- Backtesting core: Freqtrade plus an adapter layer
- Forecasting: FreqAI with a first-pass LightGBM model
- Persistence: Postgres for run metadata, local files for heavy artifacts
