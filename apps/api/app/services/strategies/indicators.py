from __future__ import annotations

from math import sqrt


def sma(values: list[float], period: int) -> list[float | None]:
    result: list[float | None] = [None] * len(values)
    for index in range(period - 1, len(values)):
        window = values[index - period + 1 : index + 1]
        result[index] = sum(window) / period
    return result


def ema(values: list[float], period: int) -> list[float | None]:
    result: list[float | None] = [None] * len(values)
    if len(values) < period:
        return result

    seed = sum(values[:period]) / period
    result[period - 1] = seed
    multiplier = 2 / (period + 1)
    previous = seed

    for index in range(period, len(values)):
        previous = ((values[index] - previous) * multiplier) + previous
        result[index] = previous

    return result


def rolling_max(values: list[float], period: int) -> list[float | None]:
    result: list[float | None] = [None] * len(values)
    for index in range(period, len(values)):
        result[index] = max(values[index - period : index])
    return result


def rolling_min(values: list[float], period: int) -> list[float | None]:
    result: list[float | None] = [None] * len(values)
    for index in range(period, len(values)):
        result[index] = min(values[index - period : index])
    return result


def rolling_std(values: list[float], period: int) -> list[float | None]:
    result: list[float | None] = [None] * len(values)
    for index in range(period - 1, len(values)):
        window = values[index - period + 1 : index + 1]
        mean = sum(window) / period
        variance = sum((value - mean) ** 2 for value in window) / period
        result[index] = sqrt(variance)
    return result


def rsi(values: list[float], period: int) -> list[float | None]:
    result: list[float | None] = [None] * len(values)
    if len(values) <= period:
        return result

    gains = []
    losses = []
    for index in range(1, period + 1):
        delta = values[index] - values[index - 1]
        gains.append(max(delta, 0))
        losses.append(abs(min(delta, 0)))

    average_gain = sum(gains) / period
    average_loss = sum(losses) / period

    result[period] = (
        100.0
        if average_loss == 0
        else 100 - (100 / (1 + (average_gain / average_loss)))
    )

    for index in range(period + 1, len(values)):
        delta = values[index] - values[index - 1]
        gain = max(delta, 0)
        loss = abs(min(delta, 0))
        average_gain = ((average_gain * (period - 1)) + gain) / period
        average_loss = ((average_loss * (period - 1)) + loss) / period

        if average_loss == 0:
            result[index] = 100.0
        else:
            rs = average_gain / average_loss
            result[index] = 100 - (100 / (1 + rs))

    return result
