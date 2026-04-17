from __future__ import annotations

from app.schemas.market import Candle

from .base import StrategyContext, StrategyOutcome
from .indicators import ema


def run(
    timeframe: str,
    candles: list[Candle],
    context: StrategyContext | None = None,
) -> StrategyOutcome:
    del context
    closes = [candle.close for candle in candles]

    fast_period, slow_period = {
        "15m": (21, 55),
        "1h": (20, 50),
        "4h": (18, 48),
        "1d": (20, 50),
        "1w": (8, 21),
    }.get(timeframe, (20, 50))
    fast = ema(closes, fast_period)
    slow = ema(closes, slow_period)

    entries = [False] * len(candles)
    exits = [False] * len(candles)
    regime_state = False

    for index in range(1, len(candles)):
        fast_now = fast[index]
        slow_now = slow[index]
        if fast_now is None or slow_now is None:
            continue

        should_hold = closes[index] > slow_now and fast_now > slow_now
        if should_hold and not regime_state:
            entries[index] = True
        if regime_state and not should_hold:
            exits[index] = True
        regime_state = should_hold

    fast_last = fast[-1] or closes[-1]
    slow_last = slow[-1] or closes[-1]
    gap = abs(fast_last - slow_last) / slow_last if slow_last else 0
    bias = (
        "bullish"
        if closes[-1] > slow_last and fast_last > slow_last
        else "defensive"
        if closes[-1] < slow_last and fast_last < slow_last
        else "neutral"
    )
    confidence = min(round(gap * 18, 2), 0.95)

    return StrategyOutcome(
        overlay_label="Slow EMA",
        overlay_values=slow,
        entries=entries,
        exits=exits,
        bias=bias,
        confidence=confidence,
    )
