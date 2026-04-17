from __future__ import annotations

from app.schemas.market import Candle

from .base import StrategyContext, StrategyOutcome
from .indicators import rolling_std, rsi, sma


def run(
    timeframe: str,
    candles: list[Candle],
    context: StrategyContext | None = None,
) -> StrategyOutcome:
    del timeframe, context

    closes = [candle.close for candle in candles]

    period = 20
    middle = sma(closes, period)
    std = rolling_std(closes, period)
    lower = [
        (mid - std_value * 2) if mid is not None and std_value is not None else None
        for mid, std_value in zip(middle, std)
    ]
    upper = [
        (mid + std_value * 2) if mid is not None and std_value is not None else None
        for mid, std_value in zip(middle, std)
    ]
    rsi_values = rsi(closes, 14)

    entries = [False] * len(candles)
    exits = [False] * len(candles)
    in_position = False

    for index in range(1, len(candles)):
        mid = middle[index]
        lower_band = lower[index]
        upper_band = upper[index]
        rsi_value = rsi_values[index]
        if mid is None or lower_band is None or upper_band is None or rsi_value is None:
            continue

        if not in_position and closes[index] < lower_band and rsi_value < 35:
            entries[index] = True
            in_position = True
        elif in_position and (closes[index] > mid or rsi_value > 60):
            exits[index] = True
            in_position = False

    latest_rsi = rsi_values[-1] or 50.0
    lower_last = lower[-1] or closes[-1]
    upper_last = upper[-1] or closes[-1]
    if closes[-1] < lower_last and latest_rsi < 35:
        bias = "bullish"
    elif closes[-1] > upper_last and latest_rsi > 65:
        bias = "defensive"
    else:
        bias = "neutral"
    confidence = min(round(abs(latest_rsi - 50) / 50, 2), 0.88)

    return StrategyOutcome(
        overlay_label="Bollinger Mid",
        overlay_values=middle,
        entries=entries,
        exits=exits,
        bias=bias,
        confidence=confidence,
    )
