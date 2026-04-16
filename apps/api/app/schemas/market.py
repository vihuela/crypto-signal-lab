from typing import Literal

from pydantic import BaseModel


class Candle(BaseModel):
    time: str
    open: float
    high: float
    low: float
    close: float
    volume: float


class OverlayPoint(BaseModel):
    time: str
    value: float


class SignalMarker(BaseModel):
    time: str
    kind: Literal["entry", "exit"]


class ReplayStats(BaseModel):
    total_return_pct: float
    buy_hold_return_pct: float
    max_drawdown_pct: float
    win_rate_pct: float
    trade_count: int
    strategy_bias: Literal["bullish", "neutral", "defensive"]
    confidence: float


class ReplayResponse(BaseModel):
    source_id: str
    source_label: str
    symbol: str
    timeframe: str
    strategy_id: str
    strategy_label: str
    overlay_label: str
    candles: list[Candle]
    overlay: list[OverlayPoint]
    markers: list[SignalMarker]
    stats: ReplayStats


class WatchlistItem(BaseModel):
    symbol: str
    source_id: str
    last_close: float
    change_pct: float
    strategy_bias: Literal["bullish", "neutral", "defensive"]
    confidence: float
