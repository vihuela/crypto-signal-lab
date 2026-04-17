from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, Literal, Optional

from app.schemas.market import Candle

StrategyBias = Literal["bullish", "neutral", "defensive"]
FactorSourceMode = Literal["live", "proxy", "unavailable"]


@dataclass
class StrategyOutcome:
    overlay_label: str
    overlay_values: list[float | None]
    entries: list[bool]
    exits: list[bool]
    bias: StrategyBias
    confidence: float
    diagnostics: "StrategyDiagnostics | None" = None


@dataclass(frozen=True)
class ExternalFactors:
    fear_greed: list[float | None] = field(default_factory=list)
    mvrv_z: list[float | None] = field(default_factory=list)
    sopr: list[float | None] = field(default_factory=list)
    etf_flow_5d_usd: list[float | None] = field(default_factory=list)
    macro_regime: list[float | None] = field(default_factory=list)
    availability: dict[str, bool] = field(default_factory=dict)


@dataclass(frozen=True)
class StrategyContext:
    source_id: str
    symbol: str
    external_factors: ExternalFactors | None = None


@dataclass(frozen=True)
class FactorReading:
    factor_id: str
    value: float | None
    source_mode: FactorSourceMode
    long_signal: bool
    defensive_signal: bool


@dataclass(frozen=True)
class FactorSeriesPoint:
    time: str
    value: float | None


@dataclass(frozen=True)
class FactorSeries:
    factor_id: str
    source_mode: FactorSourceMode
    points: list[FactorSeriesPoint]


@dataclass(frozen=True)
class StrategyDiagnostics:
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


StrategyRunner = Callable[[str, list[Candle], Optional[StrategyContext]], StrategyOutcome]
