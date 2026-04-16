from __future__ import annotations

from app.schemas.market import Candle

from .base import StrategyOutcome
from .indicators import ema


def run(timeframe: str, candles: list[Candle]) -> StrategyOutcome:
    closes = [candle.close for candle in candles]

    fast_period = 20 if timeframe == "1d" else 8
    slow_period = 50 if timeframe == "1d" else 21
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
