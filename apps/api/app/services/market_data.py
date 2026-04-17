from __future__ import annotations

from datetime import datetime, timezone

import httpx
from fastapi import HTTPException

from app.core.catalog import SUPPORTED_SOURCES, SUPPORTED_TIMEFRAMES
from app.schemas.market import Candle


def _format_time(timestamp_ms: int) -> str:
    return (
        datetime.fromtimestamp(timestamp_ms / 1000, tz=timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )


async def fetch_candles(
    source_id: str, symbol: str, timeframe: str, limit: int = 1000, end_time: str | None = None
) -> list[Candle]:
    if source_id not in SUPPORTED_SOURCES:
        raise HTTPException(status_code=400, detail=f"Unsupported source: {source_id}")

    if timeframe not in SUPPORTED_TIMEFRAMES:
        raise HTTPException(status_code=400, detail=f"Unsupported timeframe: {timeframe}")

    end_time_ms: int | None = None
    if end_time:
        end_time_ms = int(datetime.fromisoformat(end_time.replace("Z", "+00:00")).timestamp() * 1000)

    if source_id == "binance-spot":
        return await _fetch_binance_candles(symbol=symbol, timeframe=timeframe, limit=limit, end_time_ms=end_time_ms)

    if source_id == "bybit-spot":
        return await _fetch_bybit_candles(symbol=symbol, timeframe=timeframe, limit=limit, end_time_ms=end_time_ms)

    raise HTTPException(status_code=400, detail=f"Unsupported source: {source_id}")


async def _fetch_binance_candles(
    symbol: str, timeframe: str, limit: int, end_time_ms: int | None = None
) -> list[Candle]:
    interval = SUPPORTED_TIMEFRAMES[timeframe]["binance"]
    url = f"{SUPPORTED_SOURCES['binance-spot']['base_url']}/api/v3/klines"
    params: dict[str, str | int] = {
        "symbol": symbol,
        "interval": interval,
        "limit": min(limit, 1500),
    }
    if end_time_ms is not None:
        params["endTime"] = end_time_ms

    async with httpx.AsyncClient(timeout=12.0) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()

    rows = response.json()

    return [
        Candle(
            time=_format_time(int(row[0])),
            open=float(row[1]),
            high=float(row[2]),
            low=float(row[3]),
            close=float(row[4]),
            volume=float(row[5]),
        )
        for row in rows
    ]


async def _fetch_bybit_candles(symbol: str, timeframe: str, limit: int, end_time_ms: int | None = None) -> list[Candle]:
    interval = SUPPORTED_TIMEFRAMES[timeframe]["bybit"]
    url = f"{SUPPORTED_SOURCES['bybit-spot']['base_url']}/v5/market/kline"
    params: dict[str, str | int] = {
        "category": "spot",
        "symbol": symbol,
        "interval": interval,
        "limit": min(limit, 1000),
    }
    if end_time_ms is not None:
        params["end"] = end_time_ms

    async with httpx.AsyncClient(timeout=12.0) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()

    payload = response.json()
    if payload.get("retCode") != 0:
        raise HTTPException(
            status_code=502,
            detail=f"Bybit error: {payload.get('retMsg', 'unknown error')}",
        )

    rows = payload["result"]["list"]
    rows.sort(key=lambda item: int(item[0]))

    return [
        Candle(
            time=_format_time(int(row[0])),
            open=float(row[1]),
            high=float(row[2]),
            low=float(row[3]),
            close=float(row[4]),
            volume=float(row[5]),
        )
        for row in rows
    ]
