from __future__ import annotations

from app.schemas.market import Candle

from .base import StrategyOutcome
from .indicators import atr


def run(timeframe: str, candles: list[Candle]) -> StrategyOutcome:
    highs = [candle.high for candle in candles]
    lows = [candle.low for candle in candles]
    closes = [candle.close for candle in candles]

    atr_period = {
        "15m": 10,
        "1h": 11,
        "4h": 12,
        "1d": 10,
        "1w": 14,
    }.get(timeframe, 10)
    multiplier = 3.0
    atr_values = atr(highs, lows, closes, atr_period)

    upper_band: list[float | None] = [None] * len(candles)
    lower_band: list[float | None] = [None] * len(candles)
    supertrend: list[float | None] = [None] * len(candles)
    trend_up = [False] * len(candles)

    for index in range(len(candles)):
        atr_value = atr_values[index]
        if atr_value is None:
            continue

        midpoint = (highs[index] + lows[index]) / 2
        basic_upper = midpoint + (multiplier * atr_value)
        basic_lower = midpoint - (multiplier * atr_value)

        if index == 0 or supertrend[index - 1] is None:
            upper_band[index] = basic_upper
            lower_band[index] = basic_lower
            supertrend[index] = basic_upper
            continue

        previous_upper = upper_band[index - 1] or basic_upper
        previous_lower = lower_band[index - 1] or basic_lower
        previous_close = closes[index - 1]

        upper_band[index] = (
            basic_upper
            if basic_upper < previous_upper or previous_close > previous_upper
            else previous_upper
        )
        lower_band[index] = (
            basic_lower
            if basic_lower > previous_lower or previous_close < previous_lower
            else previous_lower
        )

        previous_supertrend = supertrend[index - 1]
        is_uptrend = (
            closes[index] > upper_band[index]
            if previous_supertrend == previous_upper
            else closes[index] >= lower_band[index]
        )
        trend_up[index] = is_uptrend
        supertrend[index] = lower_band[index] if is_uptrend else upper_band[index]

    entries = [False] * len(candles)
    exits = [False] * len(candles)
    in_position = False

    for index, line in enumerate(supertrend):
        if line is None:
            continue

        should_hold = trend_up[index] and closes[index] >= line
        if should_hold and not in_position:
            entries[index] = True
            in_position = True
        elif in_position and not should_hold:
            exits[index] = True
            in_position = False

    latest_line = supertrend[-1] or closes[-1]
    distance = abs(closes[-1] - latest_line) / closes[-1] if closes[-1] else 0.0
    bias = "bullish" if trend_up[-1] else "defensive"
    confidence = min(round(distance * 24, 2), 0.95)

    return StrategyOutcome(
        overlay_label="Supertrend",
        overlay_values=supertrend,
        entries=entries,
        exits=exits,
        bias=bias,
        confidence=confidence,
    )
