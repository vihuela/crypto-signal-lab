from __future__ import annotations

import asyncio
import json
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

import httpx

from app.core.config import get_settings
from app.schemas.market import Candle
from app.services.strategies.base import ExternalFactors, StrategyContext

_GLASSNODE_BASE_URL = "https://api.glassnode.com"
_SOSOVALUE_BASE_URLS = (
    "https://openapi.sosovalue.com",
    "https://api.sosovalue.xyz",
)
_FRED_BASE_URL = "https://api.stlouisfed.org/fred"
_FEAR_GREED_URL = "https://api.alternative.me/fng/"
_SOSOVALUE_ETF_TYPES = {
    "BTCUSDT": "us-btc-spot",
    "ETHUSDT": "us-eth-spot",
}
_CACHE: dict[str, tuple[float, Any]] = {}


@dataclass(frozen=True)
class _TimedValue:
    timestamp: datetime
    value: float


async def build_strategy_context(
    source_id: str,
    symbol: str,
    candles: list[Candle],
    strategy_id: str,
) -> StrategyContext:
    context = StrategyContext(source_id=source_id, symbol=symbol, external_factors=None)

    if strategy_id != "jiayi-four-factor" or not candles:
        return context

    settings = get_settings()
    fear_greed_points: list[_TimedValue] = []
    mvrv_points: list[_TimedValue] = []
    sopr_points: list[_TimedValue] = []
    etf_points: list[_TimedValue] = []
    macro_points: list[_TimedValue] = []

    fear_greed_points = await _fetch_fear_greed_series(
        ttl_seconds=settings.factor_cache_ttl_seconds,
    )

    if settings.glassnode_api_key and symbol == "BTCUSDT":
        mvrv_points, sopr_points, etf_points = await _fetch_glassnode_factor_bundle(
            api_key=settings.glassnode_api_key,
            ttl_seconds=settings.factor_cache_ttl_seconds,
        )

    if settings.sosovalue_api_key and symbol in _SOSOVALUE_ETF_TYPES:
        sosovalue_etf_points = await _fetch_sosovalue_etf_series(
            api_key=settings.sosovalue_api_key,
            symbol=symbol,
            ttl_seconds=settings.factor_cache_ttl_seconds,
        )
        if sosovalue_etf_points:
            etf_points = sosovalue_etf_points

    if settings.fred_api_key:
        macro_points = await _fetch_macro_regime_series(
            api_key=settings.fred_api_key,
            ttl_seconds=settings.factor_cache_ttl_seconds,
        )

    external_factors = ExternalFactors(
        fear_greed=_align_series(candles, fear_greed_points),
        mvrv_z=_align_series(candles, mvrv_points),
        sopr=_align_series(candles, sopr_points),
        etf_flow_5d_usd=_align_series(candles, etf_points),
        macro_regime=_align_series(candles, macro_points),
        availability={
            "fear_greed": bool(fear_greed_points),
            "mvrv_z": bool(mvrv_points),
            "sopr": bool(sopr_points),
            "etf_flow_5d_usd": bool(etf_points),
            "macro_regime": bool(macro_points),
        },
    )
    return StrategyContext(
        source_id=source_id,
        symbol=symbol,
        external_factors=external_factors,
    )


async def _fetch_fear_greed_series(ttl_seconds: int) -> list[_TimedValue]:
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            payload = await _fetch_json(
                client=client,
                url=_FEAR_GREED_URL,
                params={"limit": 180, "format": "json"},
                ttl_seconds=ttl_seconds,
            )
    except Exception:
        return []

    rows = payload.get("data", []) if isinstance(payload, dict) else []
    points: list[_TimedValue] = []
    for row in rows:
        raw_timestamp = row.get("timestamp")
        raw_value = row.get("value")
        if raw_timestamp in (None, "") or raw_value in (None, ""):
            continue
        try:
            timestamp = datetime.fromtimestamp(int(raw_timestamp), tz=timezone.utc)
            points.append(_TimedValue(timestamp=timestamp, value=float(raw_value)))
        except (TypeError, ValueError, OSError):
            continue
    points.sort(key=lambda point: point.timestamp)
    return points


async def _fetch_glassnode_factor_bundle(
    api_key: str,
    ttl_seconds: int,
) -> tuple[list[_TimedValue], list[_TimedValue], list[_TimedValue]]:
    mvrv_rows, sopr_rows, etf_rows = await _gather_glassnode_rows(api_key, ttl_seconds)
    return (
        _parse_glassnode_rows(mvrv_rows, "v"),
        _parse_glassnode_rows(sopr_rows, "v"),
        _rolling_sum(
            _parse_glassnode_rows(etf_rows, "v"),
            window=5,
        ),
    )


async def _gather_glassnode_rows(
    api_key: str,
    ttl_seconds: int,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    try:
        async with httpx.AsyncClient(timeout=16.0) as client:
            return await asyncio.gather(
                _fetch_glassnode_series(
                    client=client,
                    path="/v1/metrics/market/mvrv_z_score",
                    api_key=api_key,
                    ttl_seconds=ttl_seconds,
                ),
                _fetch_glassnode_series(
                    client=client,
                    path="/v1/metrics/indicators/sopr_adjusted",
                    api_key=api_key,
                    ttl_seconds=ttl_seconds,
                ),
                _fetch_glassnode_series(
                    client=client,
                    path="/v1/metrics/institutions/us_spot_etf_flows_net",
                    api_key=api_key,
                    ttl_seconds=ttl_seconds,
                    currency="USD",
                ),
            )
    except Exception:
        return ([], [], [])


async def _fetch_glassnode_series(
    client: httpx.AsyncClient,
    path: str,
    api_key: str,
    ttl_seconds: int,
    currency: str | None = None,
) -> list[dict[str, Any]]:
    params = {
        "a": "BTC",
        "api_key": api_key,
        "i": "24h",
        "timestamp_format": "humanized",
    }
    if currency:
        params["c"] = currency
    return await _fetch_json(
        client=client,
        url=f"{_GLASSNODE_BASE_URL}{path}",
        params=params,
        ttl_seconds=ttl_seconds,
    )


async def _fetch_macro_regime_series(
    api_key: str,
    ttl_seconds: int,
) -> list[_TimedValue]:
    try:
        async with httpx.AsyncClient(timeout=16.0) as client:
            m2_rows, fed_rows = await asyncio.gather(
                _fetch_fred_series(
                    client=client,
                    series_id="M2SL",
                    api_key=api_key,
                    ttl_seconds=ttl_seconds,
                    units="pc1",
                ),
                _fetch_fred_series(
                    client=client,
                    series_id="FEDFUNDS",
                    api_key=api_key,
                    ttl_seconds=ttl_seconds,
                ),
            )
    except Exception:
        return []

    m2_points = _parse_fred_rows(m2_rows)
    fed_points = _parse_fred_rows(fed_rows)
    if not m2_points or not fed_points:
        return []

    fed_delta_points = _difference(fed_points, periods=3)
    return _build_macro_regime(m2_points, fed_delta_points)


async def _fetch_sosovalue_etf_series(
    api_key: str,
    symbol: str,
    ttl_seconds: int,
) -> list[_TimedValue]:
    etf_type = _SOSOVALUE_ETF_TYPES.get(symbol)
    if not etf_type:
        return []

    try:
        async with httpx.AsyncClient(timeout=16.0) as client:
            payload = await _fetch_sosovalue_json(
                client=client,
                path="/openapi/v2/etf/historicalInflowChart",
                api_key=api_key,
                body={"type": etf_type},
                ttl_seconds=ttl_seconds,
            )
    except Exception:
        return []

    rows = _extract_sosovalue_rows(payload)
    if not rows:
        return []
    return _rolling_sum(_parse_sosovalue_rows(rows, "totalNetInflow"), window=5)


async def _fetch_fred_series(
    client: httpx.AsyncClient,
    series_id: str,
    api_key: str,
    ttl_seconds: int,
    units: str | None = None,
) -> list[dict[str, Any]]:
    params = {
        "series_id": series_id,
        "api_key": api_key,
        "file_type": "json",
        "sort_order": "asc",
    }
    if units:
        params["units"] = units

    payload = await _fetch_json(
        client=client,
        url=f"{_FRED_BASE_URL}/series/observations",
        params=params,
        ttl_seconds=ttl_seconds,
    )
    return payload.get("observations", [])


async def _fetch_json(
    client: httpx.AsyncClient,
    url: str,
    params: dict[str, Any],
    ttl_seconds: int,
) -> Any:
    cache_key = json.dumps([url, sorted(params.items())], separators=(",", ":"))
    cached = _CACHE.get(cache_key)
    now = time.time()
    if cached and cached[0] > now:
        return cached[1]

    response = await client.get(url, params=params)
    response.raise_for_status()
    payload = response.json()
    _CACHE[cache_key] = (now + ttl_seconds, payload)
    return payload


async def _fetch_sosovalue_json(
    client: httpx.AsyncClient,
    path: str,
    api_key: str,
    body: dict[str, Any],
    ttl_seconds: int,
) -> Any:
    cache_key = json.dumps(
        ["sosovalue", path, sorted(body.items())],
        separators=(",", ":"),
    )
    cached = _CACHE.get(cache_key)
    now = time.time()
    if cached and cached[0] > now:
        return cached[1]

    last_error: Exception | None = None
    for base_url in _SOSOVALUE_BASE_URLS:
        try:
            response = await client.post(
                f"{base_url}{path}",
                headers={
                    "x-soso-api-key": api_key,
                    "content-type": "application/json",
                },
                json=body,
            )
            response.raise_for_status()
            payload = response.json()
            _CACHE[cache_key] = (now + ttl_seconds, payload)
            return payload
        except Exception as exc:
            last_error = exc

    if last_error is not None:
        raise last_error
    raise RuntimeError("SoSoValue request failed without a response")


def _parse_glassnode_rows(rows: list[dict[str, Any]], value_key: str) -> list[_TimedValue]:
    if not isinstance(rows, list):
        return []

    points: list[_TimedValue] = []
    for row in rows:
        raw_time = row.get("t")
        raw_value = row.get(value_key)
        if raw_time is None or raw_value in (None, ""):
            continue
        try:
            points.append(
                _TimedValue(
                    timestamp=_parse_time(raw_time),
                    value=float(raw_value),
                )
            )
        except (TypeError, ValueError):
            continue
    return points


def _parse_fred_rows(rows: list[dict[str, Any]]) -> list[_TimedValue]:
    points: list[_TimedValue] = []
    for row in rows:
        raw_time = row.get("date")
        raw_value = row.get("value")
        if raw_time is None or raw_value in (None, "", "."):
            continue
        try:
            points.append(
                _TimedValue(
                    timestamp=datetime.fromisoformat(raw_time).replace(tzinfo=timezone.utc),
                    value=float(raw_value),
                )
            )
        except ValueError:
            continue
    return points


def _parse_sosovalue_rows(rows: list[dict[str, Any]], value_key: str) -> list[_TimedValue]:
    if not isinstance(rows, list):
        return []

    points: list[_TimedValue] = []
    for row in rows:
        raw_time = row.get("date")
        raw_value = row.get(value_key)
        if raw_time in (None, "") or raw_value in (None, ""):
            continue
        try:
            points.append(
                _TimedValue(
                    timestamp=datetime.fromisoformat(raw_time).replace(tzinfo=timezone.utc),
                    value=float(raw_value),
                )
            )
        except (TypeError, ValueError):
            continue
    points.sort(key=lambda point: point.timestamp)
    return points


def _extract_sosovalue_rows(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [row for row in payload if isinstance(row, dict)]

    if not isinstance(payload, dict):
        return []

    if payload.get("code") not in (None, 0):
        return []

    data = payload.get("data")
    if isinstance(data, dict):
        rows = data.get("list")
        if isinstance(rows, list):
            return [row for row in rows if isinstance(row, dict)]
        return []
    if isinstance(data, list):
        return [row for row in data if isinstance(row, dict)]
    return []


def _rolling_sum(points: list[_TimedValue], window: int) -> list[_TimedValue]:
    results: list[_TimedValue] = []
    running = 0.0
    values: list[float] = []
    for point in points:
        values.append(point.value)
        running += point.value
        if len(values) > window:
            running -= values[-window - 1]
        if len(values) >= window:
            results.append(_TimedValue(timestamp=point.timestamp, value=running))
    return results


def _difference(points: list[_TimedValue], periods: int) -> list[_TimedValue]:
    results: list[_TimedValue] = []
    for index in range(periods, len(points)):
        results.append(
            _TimedValue(
                timestamp=points[index].timestamp,
                value=points[index].value - points[index - periods].value,
            )
        )
    return results


def _build_macro_regime(
    m2_points: list[_TimedValue],
    fed_delta_points: list[_TimedValue],
) -> list[_TimedValue]:
    fed_index = 0
    latest_fed_delta: float | None = None
    results: list[_TimedValue] = []

    for point in m2_points:
        while (
            fed_index < len(fed_delta_points)
            and fed_delta_points[fed_index].timestamp <= point.timestamp
        ):
            latest_fed_delta = fed_delta_points[fed_index].value
            fed_index += 1

        if latest_fed_delta is None:
            continue

        if point.value >= 0 and latest_fed_delta <= 0:
            regime = 1.0
        elif point.value < 0 and latest_fed_delta >= 0.25:
            regime = -1.0
        else:
            regime = 0.0
        results.append(_TimedValue(timestamp=point.timestamp, value=regime))

    return results


def _align_series(
    candles: list[Candle],
    points: list[_TimedValue],
) -> list[float | None]:
    aligned: list[float | None] = []
    point_index = 0
    latest: float | None = None

    for candle in candles:
        candle_time = _parse_time(candle.time)
        while point_index < len(points) and points[point_index].timestamp <= candle_time:
            latest = points[point_index].value
            point_index += 1
        aligned.append(latest)
    return aligned


def _parse_time(raw_time: str) -> datetime:
    normalized = raw_time.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)
