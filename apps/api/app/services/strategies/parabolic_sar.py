from __future__ import annotations

from app.schemas.market import Candle

from .base import StrategyContext, StrategyOutcome


def run(
    timeframe: str,
    candles: list[Candle],
    context: StrategyContext | None = None,
) -> StrategyOutcome:
    del timeframe, context

    highs = [candle.high for candle in candles]
    lows = [candle.low for candle in candles]
    closes = [candle.close for candle in candles]

    step = 0.02
    max_step = 0.2

    psar: list[float | None] = [None] * len(candles)
    trend_up = [False] * len(candles)
    if len(candles) < 2:
        return StrategyOutcome(
            overlay_label="Parabolic SAR",
            overlay_values=psar,
            entries=[False] * len(candles),
            exits=[False] * len(candles),
            bias="neutral",
            confidence=0.0,
        )

    bull_trend = closes[1] >= closes[0]
    trend_up[0] = bull_trend
    psar[0] = lows[0] if bull_trend else highs[0]
    acceleration = step
    extreme_point = highs[0] if bull_trend else lows[0]

    for index in range(1, len(candles)):
        previous_psar = psar[index - 1] or (lows[index - 1] if bull_trend else highs[index - 1])
        current_psar = previous_psar + (acceleration * (extreme_point - previous_psar))

        if bull_trend:
            current_psar = min(
                current_psar,
                lows[index - 1],
                lows[index - 2] if index > 1 else lows[index - 1],
            )
            if lows[index] < current_psar:
                bull_trend = False
                current_psar = extreme_point
                extreme_point = lows[index]
                acceleration = step
            else:
                if highs[index] > extreme_point:
                    extreme_point = highs[index]
                    acceleration = min(acceleration + step, max_step)
        else:
            current_psar = max(
                current_psar,
                highs[index - 1],
                highs[index - 2] if index > 1 else highs[index - 1],
            )
            if highs[index] > current_psar:
                bull_trend = True
                current_psar = extreme_point
                extreme_point = highs[index]
                acceleration = step
            else:
                if lows[index] < extreme_point:
                    extreme_point = lows[index]
                    acceleration = min(acceleration + step, max_step)

        psar[index] = current_psar
        trend_up[index] = bull_trend

    entries = [False] * len(candles)
    exits = [False] * len(candles)
    in_position = False

    for index, sar_value in enumerate(psar):
        if sar_value is None:
            continue

        should_hold = trend_up[index] and closes[index] >= sar_value
        if should_hold and not in_position:
            entries[index] = True
            in_position = True
        elif in_position and not should_hold:
            exits[index] = True
            in_position = False

    latest_psar = psar[-1] or closes[-1]
    distance = abs(closes[-1] - latest_psar) / closes[-1] if closes[-1] else 0.0
    if trend_up[-1] and closes[-1] > latest_psar:
        bias = "bullish"
    elif not trend_up[-1] and closes[-1] < latest_psar:
        bias = "defensive"
    else:
        bias = "neutral"
    confidence = min(round(distance * 20, 2), 0.9)

    return StrategyOutcome(
        overlay_label="Parabolic SAR",
        overlay_values=psar,
        entries=entries,
        exits=exits,
        bias=bias,
        confidence=confidence,
    )
