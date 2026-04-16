export type SourceId = "binance-spot" | "bybit-spot";
export type Timeframe = "1d" | "1w";
export type StrategyId =
  | "ema-regime"
  | "donchian-breakout"
  | "rsi-bollinger-swing";
export type Bias = "bullish" | "neutral" | "defensive";

export type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type OverlayPoint = {
  time: string;
  value: number;
};

export type SignalMarker = {
  time: string;
  kind: "entry" | "exit";
};

export type ReplayResponse = {
  source_id: SourceId;
  source_label: string;
  symbol: string;
  timeframe: Timeframe;
  strategy_id: StrategyId;
  strategy_label: string;
  overlay_label: string;
  candles: Candle[];
  overlay: OverlayPoint[];
  markers: SignalMarker[];
  stats: {
    total_return_pct: number;
    buy_hold_return_pct: number;
    max_drawdown_pct: number;
    win_rate_pct: number;
    trade_count: number;
    strategy_bias: Bias;
    confidence: number;
  };
};

export type WatchlistItem = {
  symbol: string;
  source_id: SourceId;
  last_close: number;
  change_pct: number;
  strategy_bias: Bias;
  confidence: number;
};
