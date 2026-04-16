from __future__ import annotations

from app.schemas.market import Candle

from .base import StrategyOutcome
from .indicators import rolling_max, rolling_min


def run(timeframe: str, candles: list[Candle]) -> StrategyOutcome:
    closes = [candle.close for candle in candles]
    highs = [candle.high for candle in candles]
    lows = [candle.low for candle in candles]

    lookback, exit_lookback = {
        "15m": (55, 20),
        "1h": (34, 13),
        "4h": (26, 10),
        "1d": (20, 10),
        "1w": (12, 6),
    }.get(timeframe, (20, 10))
    upper = rolling_max(highs, lookback)
    lower = rolling_min(lows, exit_lookback)
    centerline = [
        ((upper_value + lower_value) / 2)
        if upper_value is not None and lower_value is not None
        else None
        for upper_value, lower_value in zip(upper, lower)
    ]

    entries = [False] * len(candles)
    exits = [False] * len(candles)
    in_position = False

    for index in range(1, len(candles)):
        upper_prev = upper[index - 1]
        lower_prev = lower[index - 1]
        if upper_prev is None or lower_prev is None:
            continue

        if not in_position and closes[index] > upper_prev:
            entries[index] = True
            in_position = True
        elif in_position and closes[index] < lower_prev:
            exits[index] = True
            in_position = False

    center_last = centerline[-1] or closes[-1]
    channel_width = 0.0
    if upper[-1] is not None and lower[-1] is not None and center_last:
        channel_width = (upper[-1] - lower[-1]) / center_last

    bias = "bullish" if closes[-1] > center_last else "neutral"
    confidence = min(round(channel_width * 6, 2), 0.92)

    return StrategyOutcome(
        overlay_label="Channel Midline",
        overlay_values=centerline,
        entries=entries,
        exits=exits,
        bias=bias,
        confidence=confidence,
    )
