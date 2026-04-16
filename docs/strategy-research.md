# Strategy Research Notes

Updated on 2026-04-16.

This project now includes a broader shortlist of chart-friendly spot strategies that are widely used in crypto discretionary workflows and easy to explain on a single replay chart.

## Added this round

- `Supertrend ATR`
  - Fit: volatility-aware trend following for daily and weekly spot moves.
  - Why it fits the product: it draws a single adaptive line directly on price, so the entry and exit markers remain readable on the current chart UI.
  - Source: [TradingView Supertrend](https://www.tradingview.com/support/solutions/43000634738-supertrend/)

- `Ichimoku Cloud`
  - Fit: higher-level trend confirmation using baseline and cloud structure.
  - Why it fits the product: even though the full indicator has multiple lines, the Kijun-Sen baseline is still informative enough to show on a simplified replay chart.
  - Source: [TradingView Ichimoku Cloud](https://www.tradingview.com/support/solutions/43000589152/)

- `Parabolic SAR`
  - Fit: faster stop-and-reverse logic for directional swings.
  - Why it fits the product: the indicator is naturally overlaid on price and gives clear visual flips.
  - Source: [TradingView Parabolic SAR](https://www.tradingview.com/support/solutions/43000502597-parabolic-sar-sar/)

## Considered but not added yet

- `MACD`
  - Good for crypto momentum work, but the product currently only supports one price-overlay helper line on the main candle chart.
  - Since MACD is more naturally displayed in a dedicated sub-panel, it is a better fit once the UI supports secondary indicator panes.
  - Source: [TradingView MACD](https://www.tradingview.com/support/solutions/43000502344/)

## Backtest workflow

To benchmark all supported strategies on live exchange candles:

```bash
cd crypto-signal-lab/apps/api
.venv/bin/python scripts/run_strategy_benchmarks.py
```

The benchmark runner fetches live candles from the asset's default exchange source and compares all strategy ids registered in `SUPPORTED_STRATEGIES`.

If you want a single consistent source for every pair during a benchmark run:

```bash
cd crypto-signal-lab/apps/api
.venv/bin/python scripts/run_strategy_benchmarks.py --source-override binance-spot
```
