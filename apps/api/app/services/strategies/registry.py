from __future__ import annotations

from typing import Final

from app.core.catalog import SUPPORTED_SOURCES, SUPPORTED_STRATEGIES
from app.schemas.market import (
    Candle,
    FactorReading,
    FactorSeries,
    FactorSeriesPoint,
    OverlayPoint,
    ReplayResponse,
    SignalMarker,
    StrategyDiagnostics,
)

from .backtest import run_backtest
from .base import StrategyContext, StrategyDiagnostics as StrategyDiagnosticsData, StrategyRunner
from .donchian_breakout import run as run_donchian_breakout
from .ema_regime import run as run_ema_regime
from .ichimoku_cloud import run as run_ichimoku_cloud
from .jiayi_four_factor import run as run_jiayi_four_factor
from .parabolic_sar import run as run_parabolic_sar
from .rsi_bollinger_swing import run as run_rsi_bollinger_swing
from .supertrend_atr import run as run_supertrend_atr

STRATEGY_RUNNERS: Final[dict[str, StrategyRunner]] = {
    "ema-regime": run_ema_regime,
    "donchian-breakout": run_donchian_breakout,
    "rsi-bollinger-swing": run_rsi_bollinger_swing,
    "supertrend-atr": run_supertrend_atr,
    "ichimoku-cloud": run_ichimoku_cloud,
    "parabolic-sar": run_parabolic_sar,
    "jiayi-four-factor": run_jiayi_four_factor,
}


def build_replay(
    source_id: str,
    symbol: str,
    timeframe: str,
    strategy_id: str,
    candles: list[Candle],
    strategy_context: StrategyContext | None = None,
) -> ReplayResponse:
    if strategy_id not in SUPPORTED_STRATEGIES:
        raise ValueError(f"Unsupported strategy: {strategy_id}")
    if strategy_id not in STRATEGY_RUNNERS:
        raise ValueError(f"Strategy runner not implemented: {strategy_id}")
    if len(candles) < 30:
        raise ValueError("Not enough candles to compute strategy replay")

    outcome = STRATEGY_RUNNERS[strategy_id](timeframe, candles, strategy_context)
    stats = run_backtest(
        candles=candles,
        entries=outcome.entries,
        exits=outcome.exits,
        bias=outcome.bias,
        confidence=outcome.confidence,
    )

    overlay = [
        OverlayPoint(time=candle.time, value=round(value, 4))
        for candle, value in zip(candles, outcome.overlay_values)
        if value is not None
    ]
    markers = [
        SignalMarker(time=candles[index].time, kind="entry")
        for index, flag in enumerate(outcome.entries)
        if flag
    ] + [
        SignalMarker(time=candles[index].time, kind="exit")
        for index, flag in enumerate(outcome.exits)
        if flag
    ]
    markers.sort(key=lambda marker: marker.time)

    return ReplayResponse(
        source_id=source_id,
        source_label=SUPPORTED_SOURCES[source_id]["label"],
        symbol=symbol,
        timeframe=timeframe,
        strategy_id=strategy_id,
        strategy_label=SUPPORTED_STRATEGIES[strategy_id]["label"],
        overlay_label=outcome.overlay_label,
        candles=candles,
        overlay=overlay,
        markers=markers,
        stats=stats,
        diagnostics=_serialize_diagnostics(outcome.diagnostics),
    )


def _serialize_diagnostics(
    diagnostics: StrategyDiagnosticsData | None,
) -> StrategyDiagnostics | None:
    if diagnostics is None:
        return None

    return StrategyDiagnostics(
        long_score=diagnostics.long_score,
        defensive_score=diagnostics.defensive_score,
        core_long_count=diagnostics.core_long_count,
        core_defensive_count=diagnostics.core_defensive_count,
        resonance_threshold=diagnostics.resonance_threshold,
        core_factor_count=diagnostics.core_factor_count,
        fear_weight=diagnostics.fear_weight,
        fear_active=diagnostics.fear_active,
        factors=[
            FactorReading(
                factor_id=factor.factor_id,
                value=None if factor.value is None else round(factor.value, 4),
                source_mode=factor.source_mode,
                long_signal=factor.long_signal,
                defensive_signal=factor.defensive_signal,
            )
            for factor in diagnostics.factors
        ],
        factor_series=[
            FactorSeries(
                factor_id=series.factor_id,
                source_mode=series.source_mode,
                points=[
                    FactorSeriesPoint(
                        time=point.time,
                        value=None if point.value is None else round(point.value, 4),
                    )
                    for point in series.points
                ],
            )
            for series in diagnostics.factor_series
        ],
    )
