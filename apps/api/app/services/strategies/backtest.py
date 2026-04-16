from __future__ import annotations

from app.schemas.market import Candle, ReplayStats

from .base import StrategyBias


def run_backtest(
    candles: list[Candle],
    entries: list[bool],
    exits: list[bool],
    bias: StrategyBias,
    confidence: float,
) -> ReplayStats:
    equity = 1.0
    peak = 1.0
    max_drawdown = 0.0
    in_position = False
    fee = 0.001
    trade_count = 0
    entry_price = 0.0
    wins = 0

    for index in range(1, len(candles)):
        previous_close = candles[index - 1].close
        current_close = candles[index].close
        if in_position and previous_close:
            equity *= current_close / previous_close

        if entries[index] and not in_position:
            in_position = True
            entry_price = current_close
            equity *= 1 - fee
        elif exits[index] and in_position:
            in_position = False
            trade_count += 1
            trade_return_pct = ((current_close / entry_price) - 1.0) * 100 - (fee * 200)
            if trade_return_pct > 0:
                wins += 1
            equity *= 1 - fee

        peak = max(peak, equity)
        drawdown = (equity / peak) - 1.0
        max_drawdown = min(max_drawdown, drawdown)

    buy_hold_return_pct = ((candles[-1].close / candles[0].close) - 1.0) * 100
    win_rate_pct = (wins / trade_count) * 100 if trade_count else 0.0

    return ReplayStats(
        total_return_pct=round((equity - 1.0) * 100, 2),
        buy_hold_return_pct=round(buy_hold_return_pct, 2),
        max_drawdown_pct=round(max_drawdown * 100, 2),
        win_rate_pct=round(win_rate_pct, 2),
        trade_count=trade_count,
        strategy_bias=bias,
        confidence=round(confidence, 2),
    )
