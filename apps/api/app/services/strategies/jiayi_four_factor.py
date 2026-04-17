from __future__ import annotations

from app.schemas.market import Candle

from .base import (
    FactorReading,
    FactorSeries,
    FactorSeriesPoint,
    StrategyContext,
    StrategyDiagnostics,
    StrategyOutcome,
)
from .indicators import ema, rsi, rolling_std, sma


def run(
    timeframe: str,
    candles: list[Candle],
    context: StrategyContext | None = None,
) -> StrategyOutcome:
    closes = [candle.close for candle in candles]
    volumes = [candle.volume for candle in candles]

    regime_fast_period, regime_slow_period, pulse_period = {
        "15m": (55, 144, 28),
        "1h": (50, 120, 28),
        "4h": (34, 89, 21),
        "1d": (21, 55, 20),
        "1w": (8, 21, 12),
    }.get(timeframe, (21, 55, 20))
    value_period = max(regime_slow_period, pulse_period * 3)
    flow_fast_period = max(5, pulse_period // 4)
    flow_slow_period = max(flow_fast_period + 2, pulse_period // 2)

    regime_fast = ema(closes, regime_fast_period)
    regime_slow = ema(closes, regime_slow_period)
    pulse_ema = ema(closes, pulse_period)
    value_mean = sma(closes, value_period)
    value_std = rolling_std(closes, value_period)
    volume_mean = sma(volumes, max(10, pulse_period))
    rsi_values = rsi(closes, 14)
    obv_values = _obv(closes, volumes)
    flow_fast = ema(obv_values, flow_fast_period)
    flow_slow = ema(obv_values, flow_slow_period)

    external_factors = context.external_factors if context else None
    fear_greed_values = _factor_series(
        external_factors.fear_greed if external_factors else None,
        len(candles),
    )
    mvrv_z = _factor_series(
        external_factors.mvrv_z if external_factors else None,
        len(candles),
    )
    sopr_values = _factor_series(
        external_factors.sopr if external_factors else None,
        len(candles),
    )
    etf_flow_values = _factor_series(
        external_factors.etf_flow_5d_usd if external_factors else None,
        len(candles),
    )
    macro_regime = _factor_series(
        external_factors.macro_regime if external_factors else None,
        len(candles),
    )
    z_score_series = _z_score_series(closes, value_mean, value_std)
    capitulation_proxy_series = [
        (close / pulse) if pulse not in (None, 0) else None
        for close, pulse in zip(closes, pulse_ema)
    ]
    flow_proxy_series = [
        (fast - slow)
        if fast is not None and slow is not None
        else None
        for fast, slow in zip(flow_fast, flow_slow)
    ]
    regime_proxy_series = _regime_proxy_series(
        closes=closes,
        fast_series=regime_fast,
        slow_series=regime_slow,
    )
    fear_display_series, fear_mode = _display_series(fear_greed_values, rsi_values)
    mvrv_display_series, mvrv_mode = _display_series(mvrv_z, z_score_series)
    sopr_display_series, sopr_mode = _display_series(
        sopr_values, capitulation_proxy_series
    )
    etf_display_series, etf_mode = _display_series(
        etf_flow_values, flow_proxy_series
    )
    macro_display_series, macro_mode = _display_series(
        macro_regime, regime_proxy_series
    )

    entries = [False] * len(candles)
    exits = [False] * len(candles)
    in_position = False

    for index in range(1, len(candles)):
        slow = regime_slow[index]
        fast = regime_fast[index]
        pulse = pulse_ema[index]
        mean = value_mean[index]
        deviation = value_std[index]
        avg_volume = volume_mean[index]
        fast_flow = flow_fast[index]
        slow_flow = flow_slow[index]
        rsi_value = rsi_values[index]
        previous_slow = regime_slow[index - 1]
        previous_flow = flow_slow[index - 1]

        if None in (
            slow,
            fast,
            pulse,
            mean,
            deviation,
            avg_volume,
            fast_flow,
            slow_flow,
            rsi_value,
            previous_slow,
            previous_flow,
        ):
            continue

        price = closes[index]
        z_score = (price - mean) / deviation if deviation else 0.0
        pulse_return = (price / closes[max(0, index - pulse_period)]) - 1.0
        flow_slope = slow_flow - previous_flow
        regime_slope = slow - previous_slow

        factor_mvrv = mvrv_z[index]
        factor_sopr = sopr_values[index]
        factor_etf = etf_flow_values[index]
        factor_macro = macro_regime[index]
        factor_fear = fear_greed_values[index]

        value_long = factor_mvrv <= 0.3 if factor_mvrv is not None else z_score <= -1.15
        capitulation_long = (
            factor_sopr < 1.0
            if factor_sopr is not None
            else (
                pulse_return <= -0.08
                and price <= pulse * 0.985
                and volumes[index] >= avg_volume * 1.05
            )
        )
        flow_long = (
            factor_etf >= 1_000_000_000
            if factor_etf is not None
            else fast_flow > slow_flow and flow_slope >= 0
        )
        regime_long = (
            factor_macro > 0
            if factor_macro is not None
            else price > slow and fast > slow and regime_slope >= 0
        )
        fear_aux = factor_fear <= 20 if factor_fear is not None else rsi_value <= 34

        overheat_short = (
            factor_mvrv >= 4.5
            if factor_mvrv is not None
            else z_score >= 1.25 and rsi_value >= 66
        )
        distribution_short = (
            factor_etf <= -500_000_000
            if factor_etf is not None
            else fast_flow < slow_flow and flow_slope <= 0
        )
        regime_short = (
            factor_macro < 0
            if factor_macro is not None
            else price < slow and fast < slow and regime_slope <= 0
        )
        momentum_loss = price < pulse and rsi_value < 48
        profit_taking = factor_sopr > 1.03 if factor_sopr is not None else False

        long_score = sum(
            [value_long, capitulation_long, flow_long, regime_long]
        ) + (0.5 if fear_aux else 0.0)
        defensive_score = sum(
            [overheat_short, distribution_short, regime_short, momentum_loss, profit_taking]
        )

        if not in_position and long_score >= 3:
            entries[index] = True
            in_position = True
        elif in_position and (defensive_score >= 2 or long_score < 2):
            exits[index] = True
            in_position = False

    latest_slow = regime_slow[-1] or closes[-1]
    latest_fast = regime_fast[-1] or closes[-1]
    latest_pulse = pulse_ema[-1] or closes[-1]
    latest_rsi = rsi_values[-1] or 50.0
    latest_flow_fast = flow_fast[-1] or obv_values[-1]
    latest_flow_slow = flow_slow[-1] or obv_values[-1]
    latest_value_mean = value_mean[-1] or closes[-1]
    latest_value_std = value_std[-1] or 1.0
    latest_z = (
        (closes[-1] - latest_value_mean) / latest_value_std if latest_value_std else 0.0
    )

    latest_factor_mvrv = mvrv_z[-1]
    latest_factor_sopr = sopr_values[-1]
    latest_factor_etf = etf_flow_values[-1]
    latest_factor_macro = macro_regime[-1]
    latest_factor_fear = fear_greed_values[-1]

    latest_value_long = (
        latest_factor_mvrv <= 0.3 if latest_factor_mvrv is not None else latest_z <= -1.15
    )
    latest_capitulation_long = (
        latest_factor_sopr < 1.0
        if latest_factor_sopr is not None
        else closes[-1] <= latest_pulse * 0.985
    )
    latest_flow_long = (
        latest_factor_etf >= 1_000_000_000
        if latest_factor_etf is not None
        else latest_flow_fast > latest_flow_slow
    )
    latest_regime_long = (
        latest_factor_macro > 0
        if latest_factor_macro is not None
        else closes[-1] > latest_slow and latest_fast > latest_slow
    )
    latest_fear_active = (
        latest_factor_fear <= 20 if latest_factor_fear is not None else latest_rsi <= 34
    )

    latest_overheat_short = (
        latest_factor_mvrv >= 4.5
        if latest_factor_mvrv is not None
        else latest_z >= 1.25 and latest_rsi >= 66
    )
    latest_distribution_short = (
        latest_factor_etf <= -500_000_000
        if latest_factor_etf is not None
        else latest_flow_fast < latest_flow_slow
    )
    latest_regime_short = (
        latest_factor_macro < 0
        if latest_factor_macro is not None
        else closes[-1] < latest_slow and latest_fast < latest_slow
    )
    latest_momentum_loss = closes[-1] < latest_pulse and latest_rsi < 48
    latest_profit_taking = latest_factor_sopr > 1.03 if latest_factor_sopr is not None else False

    latest_long_score = sum(
        [
            latest_value_long,
            latest_capitulation_long,
            latest_flow_long,
            latest_regime_long,
        ]
    ) + (0.5 if latest_fear_active else 0.0)
    latest_defensive_score = sum(
        [
            latest_overheat_short,
            latest_distribution_short,
            latest_regime_short,
            latest_momentum_loss,
            latest_profit_taking,
        ]
    )
    latest_capitulation_proxy = (
        (closes[-1] / latest_pulse) if latest_pulse else None
    )
    latest_flow_proxy = latest_flow_fast - latest_flow_slow

    if latest_long_score >= 3:
        bias = "bullish"
    elif latest_defensive_score >= 2:
        bias = "defensive"
    else:
        bias = "neutral"

    confidence = min(round(max(latest_long_score, latest_defensive_score) / 4.5, 2), 0.96)

    diagnostics = StrategyDiagnostics(
        long_score=round(latest_long_score, 2),
        defensive_score=round(latest_defensive_score, 2),
        core_long_count=sum(
            [
                latest_value_long,
                latest_capitulation_long,
                latest_flow_long,
                latest_regime_long,
            ]
        ),
        core_defensive_count=sum(
            [
                latest_overheat_short,
                latest_distribution_short,
                latest_regime_short,
                latest_momentum_loss,
                latest_profit_taking,
            ]
        ),
        resonance_threshold=3,
        core_factor_count=4,
        fear_weight=0.5 if latest_fear_active else 0.0,
        fear_active=latest_fear_active,
        factors=[
            FactorReading(
                factor_id="fear_greed",
                value=latest_factor_fear if latest_factor_fear is not None else latest_rsi,
                source_mode=fear_mode,
                long_signal=latest_fear_active,
                defensive_signal=False,
            ),
            FactorReading(
                factor_id="mvrv_z",
                value=latest_factor_mvrv if latest_factor_mvrv is not None else latest_z,
                source_mode=mvrv_mode,
                long_signal=latest_value_long,
                defensive_signal=latest_overheat_short,
            ),
            FactorReading(
                factor_id="sopr",
                value=latest_factor_sopr if latest_factor_sopr is not None else latest_capitulation_proxy,
                source_mode=sopr_mode,
                long_signal=latest_capitulation_long,
                defensive_signal=latest_profit_taking,
            ),
            FactorReading(
                factor_id="etf_flow_5d_usd",
                value=latest_factor_etf if latest_factor_etf is not None else latest_flow_proxy,
                source_mode=etf_mode,
                long_signal=latest_flow_long,
                defensive_signal=latest_distribution_short,
            ),
            FactorReading(
                factor_id="macro_regime",
                value=latest_factor_macro if latest_factor_macro is not None else (1.0 if latest_regime_long else -1.0 if latest_regime_short else 0.0),
                source_mode=macro_mode,
                long_signal=latest_regime_long,
                defensive_signal=latest_regime_short,
            ),
        ],
        factor_series=[
            _build_factor_series("fear_greed", fear_mode, candles, fear_display_series),
            _build_factor_series("mvrv_z", mvrv_mode, candles, mvrv_display_series),
            _build_factor_series("sopr", sopr_mode, candles, sopr_display_series),
            _build_factor_series(
                "etf_flow_5d_usd",
                etf_mode,
                candles,
                etf_display_series,
            ),
            _build_factor_series(
                "macro_regime",
                macro_mode,
                candles,
                macro_display_series,
            ),
        ],
    )

    return StrategyOutcome(
        overlay_label="Resonance EMA",
        overlay_values=regime_slow,
        entries=entries,
        exits=exits,
        bias=bias,
        confidence=confidence,
        diagnostics=diagnostics,
    )


def _factor_series(values: list[float | None] | None, length: int) -> list[float | None]:
    if values and len(values) == length:
        return values
    return [None] * length


def _display_series(
    live_values: list[float | None],
    proxy_values: list[float | None],
) -> tuple[list[float | None], str]:
    if any(value is not None for value in live_values):
        return live_values, "live"
    if any(value is not None for value in proxy_values):
        return proxy_values, "proxy"
    return [None] * len(proxy_values), "unavailable"


def _z_score_series(
    closes: list[float],
    value_mean: list[float | None],
    value_std: list[float | None],
) -> list[float | None]:
    values: list[float | None] = []
    for close, mean, deviation in zip(closes, value_mean, value_std):
        if mean is None or deviation in (None, 0):
            values.append(None)
        else:
            values.append((close - mean) / deviation)
    return values


def _regime_proxy_series(
    closes: list[float],
    fast_series: list[float | None],
    slow_series: list[float | None],
) -> list[float | None]:
    values: list[float | None] = [None] * len(closes)
    for index in range(1, len(closes)):
        fast = fast_series[index]
        slow = slow_series[index]
        previous_slow = slow_series[index - 1]
        if fast is None or slow is None or previous_slow is None:
            continue
        slope = slow - previous_slow
        if closes[index] > slow and fast > slow and slope >= 0:
            values[index] = 1.0
        elif closes[index] < slow and fast < slow and slope <= 0:
            values[index] = -1.0
        else:
            values[index] = 0.0
    return values


def _build_factor_series(
    factor_id: str,
    source_mode: str,
    candles: list[Candle],
    values: list[float | None],
) -> FactorSeries:
    return FactorSeries(
        factor_id=factor_id,
        source_mode=source_mode,
        points=[
            FactorSeriesPoint(
                time=candle.time,
                value=value,
            )
            for candle, value in zip(candles, values)
        ],
    )


def _obv(closes: list[float], volumes: list[float]) -> list[float]:
    values = [0.0] * len(closes)
    for index in range(1, len(closes)):
        if closes[index] > closes[index - 1]:
            values[index] = values[index - 1] + volumes[index]
        elif closes[index] < closes[index - 1]:
            values[index] = values[index - 1] - volumes[index]
        else:
            values[index] = values[index - 1]
    return values
