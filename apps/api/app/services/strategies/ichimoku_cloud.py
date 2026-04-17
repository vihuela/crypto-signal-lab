from __future__ import annotations

from app.schemas.market import Candle

from .base import StrategyContext, StrategyOutcome
from .indicators import rolling_midpoint


def run(
    timeframe: str,
    candles: list[Candle],
    context: StrategyContext | None = None,
) -> StrategyOutcome:
    del timeframe, context

    highs = [candle.high for candle in candles]
    lows = [candle.low for candle in candles]
    closes = [candle.close for candle in candles]

    tenkan = rolling_midpoint(highs, lows, 9)
    kijun = rolling_midpoint(highs, lows, 26)
    senkou_b = rolling_midpoint(highs, lows, 52)
    senkou_a = [
        ((tenkan_value + kijun_value) / 2)
        if tenkan_value is not None and kijun_value is not None
        else None
        for tenkan_value, kijun_value in zip(tenkan, kijun)
    ]

    entries = [False] * len(candles)
    exits = [False] * len(candles)
    in_position = False

    for index in range(len(candles)):
        tenkan_value = tenkan[index]
        kijun_value = kijun[index]
        span_a = senkou_a[index]
        span_b = senkou_b[index]
        if (
            tenkan_value is None
            or kijun_value is None
            or span_a is None
            or span_b is None
            or index < 26
        ):
            continue

        cloud_top = max(span_a, span_b)
        cloud_bottom = min(span_a, span_b)
        should_hold = (
            closes[index] > cloud_top
            and tenkan_value > kijun_value
            and closes[index] > closes[index - 26]
        )

        if should_hold and not in_position:
            entries[index] = True
            in_position = True
        elif in_position and (
            closes[index] < cloud_bottom or tenkan_value < kijun_value
        ):
            exits[index] = True
            in_position = False

    latest_tenkan = tenkan[-1]
    latest_kijun = kijun[-1]
    latest_span_a = senkou_a[-1]
    latest_span_b = senkou_b[-1]
    latest_kijun_line = latest_kijun or closes[-1]

    if (
        latest_tenkan is not None
        and latest_kijun is not None
        and latest_span_a is not None
        and latest_span_b is not None
    ):
        cloud_top = max(latest_span_a, latest_span_b)
        cloud_bottom = min(latest_span_a, latest_span_b)
        if closes[-1] > cloud_top and latest_tenkan > latest_kijun:
            bias = "bullish"
        elif closes[-1] < cloud_bottom and latest_tenkan < latest_kijun:
            bias = "defensive"
        else:
            bias = "neutral"
        cloud_thickness = abs(latest_span_a - latest_span_b) / closes[-1] if closes[-1] else 0.0
        cloud_distance = (
            abs(closes[-1] - latest_kijun_line) / closes[-1] if closes[-1] else 0.0
        )
        confidence = min(round((cloud_distance + cloud_thickness) * 10, 2), 0.94)
    else:
        bias = "neutral"
        confidence = 0.0

    return StrategyOutcome(
        overlay_label="Kijun-Sen",
        overlay_values=kijun,
        entries=entries,
        exits=exits,
        bias=bias,
        confidence=confidence,
    )
