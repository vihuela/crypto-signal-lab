from __future__ import annotations

from typing import Final

from app.core.catalog import SUPPORTED_SOURCES, SUPPORTED_STRATEGIES
from app.schemas.market import Candle, OverlayPoint, ReplayResponse, SignalMarker

from .backtest import run_backtest
from .base import StrategyRunner
from .donchian_breakout import run as run_donchian_breakout
from .ema_regime import run as run_ema_regime
from .ichimoku_cloud import run as run_ichimoku_cloud
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
}


def build_replay(
    source_id: str,
    symbol: str,
    timeframe: str,
    strategy_id: str,
    candles: list[Candle],
) -> ReplayResponse:
    if strategy_id not in SUPPORTED_STRATEGIES:
        raise ValueError(f"Unsupported strategy: {strategy_id}")
    if strategy_id not in STRATEGY_RUNNERS:
        raise ValueError(f"Strategy runner not implemented: {strategy_id}")
    if len(candles) < 30:
        raise ValueError("Not enough candles to compute strategy replay")

    outcome = STRATEGY_RUNNERS[strategy_id](timeframe, candles)
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
    )
