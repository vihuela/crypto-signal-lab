import type { SourceId, StrategyId, Timeframe } from "@/features/dashboard/types";

export const sourceOptions: { value: SourceId }[] = [
  { value: "binance-spot" },
  { value: "bybit-spot" },
];

export const symbolOptions = [
  { value: "BTCUSDT" },
  { value: "ETHUSDT" },
  { value: "SOLUSDT" },
  { value: "DOGEUSDT" },
] as const;

export const timeframeOptions: { value: Timeframe }[] = [
  { value: "1d" },
  { value: "1w" },
];

export const replayLimitByTimeframe: Record<Timeframe, number> = {
  "1d": 1000,
  "1w": 1000,
};

export const strategyOptions: {
  value: StrategyId | "community-adapter";
  disabled?: boolean;
}[] = [
  { value: "ema-regime" },
  { value: "donchian-breakout" },
  { value: "rsi-bollinger-swing" },
  { value: "community-adapter", disabled: true },
];
