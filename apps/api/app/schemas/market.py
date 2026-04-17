from __future__ import annotations

from typing import Literal, Optional

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


class FactorReading(BaseModel):
    factor_id: Literal[
        "fear_greed",
        "mvrv_z",
        "sopr",
        "etf_flow_5d_usd",
        "macro_regime",
    ]
    value: Optional[float]
    source_mode: Literal["live", "proxy", "unavailable"]
    long_signal: bool
    defensive_signal: bool


class FactorSeriesPoint(BaseModel):
    time: str
    value: Optional[float]


class FactorSeries(BaseModel):
    factor_id: Literal[
        "fear_greed",
        "mvrv_z",
        "sopr",
        "etf_flow_5d_usd",
        "macro_regime",
    ]
    source_mode: Literal["live", "proxy", "unavailable"]
    points: list[FactorSeriesPoint]


class StrategyDiagnostics(BaseModel):
    long_score: float
    defensive_score: float
    core_long_count: int
    core_defensive_count: int
    resonance_threshold: int
    core_factor_count: int
    fear_weight: float
    fear_active: bool
    factors: list[FactorReading]
    factor_series: list[FactorSeries]


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
    diagnostics: Optional[StrategyDiagnostics] = None


class StrategyLeaderboardEntry(BaseModel):
    strategy_id: str
    strategy_label: str
    strategy_style: str
    total_return_pct: float
    edge_vs_hold_pct: float
    max_drawdown_pct: float
    win_rate_pct: float
    trade_count: int
    strategy_bias: Literal["bullish", "neutral", "defensive"]
    confidence: float


class StrategyLeaderboardResponse(BaseModel):
    source_id: str
    source_label: str
    symbol: str
    timeframe: str
    candle_count: int
    start_time: str
    end_time: str
    buy_hold_return_pct: float
    entries: list[StrategyLeaderboardEntry]


class WatchlistItem(BaseModel):
    symbol: str
    source_id: str
    last_close: float
    change_pct: float
    strategy_bias: Literal["bullish", "neutral", "defensive"]
    confidence: float
