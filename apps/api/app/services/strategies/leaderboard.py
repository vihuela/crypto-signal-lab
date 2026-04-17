from __future__ import annotations

from app.core.catalog import SUPPORTED_SOURCES, SUPPORTED_STRATEGIES
from app.schemas.market import (
    Candle,
    StrategyLeaderboardEntry,
    StrategyLeaderboardResponse,
)

from .backtest import run_backtest
from .base import StrategyContext
from .registry import STRATEGY_RUNNERS


def build_strategy_leaderboard(
    source_id: str,
    symbol: str,
    timeframe: str,
    candles: list[Candle],
    strategy_context: StrategyContext | None = None,
) -> StrategyLeaderboardResponse:
    if len(candles) < 30:
        raise ValueError("Not enough candles to compute strategy leaderboard")

    entries: list[StrategyLeaderboardEntry] = []

    for strategy_id, metadata in SUPPORTED_STRATEGIES.items():
        if strategy_id not in STRATEGY_RUNNERS:
            continue

        outcome = STRATEGY_RUNNERS[strategy_id](timeframe, candles, strategy_context)
        stats = run_backtest(
            candles=candles,
            entries=outcome.entries,
            exits=outcome.exits,
            bias=outcome.bias,
            confidence=outcome.confidence,
        )
        entries.append(
            StrategyLeaderboardEntry(
                strategy_id=strategy_id,
                strategy_label=metadata["label"],
                strategy_style=metadata["style"],
                total_return_pct=stats.total_return_pct,
                edge_vs_hold_pct=round(
                    stats.total_return_pct - stats.buy_hold_return_pct,
                    2,
                ),
                max_drawdown_pct=stats.max_drawdown_pct,
                win_rate_pct=stats.win_rate_pct,
                trade_count=stats.trade_count,
                strategy_bias=stats.strategy_bias,
                confidence=stats.confidence,
            )
        )

    entries.sort(
        key=lambda entry: (
            entry.edge_vs_hold_pct,
            entry.total_return_pct,
            entry.max_drawdown_pct,
            entry.win_rate_pct,
        ),
        reverse=True,
    )

    buy_hold_return_pct = (
        round(((candles[-1].close / candles[0].close) - 1.0) * 100, 2)
        if candles[0].close
        else 0.0
    )

    return StrategyLeaderboardResponse(
        source_id=source_id,
        source_label=SUPPORTED_SOURCES[source_id]["label"],
        symbol=symbol,
        timeframe=timeframe,
        candle_count=len(candles),
        start_time=candles[0].time,
        end_time=candles[-1].time,
        buy_hold_return_pct=buy_hold_return_pct,
        entries=entries,
    )
