import asyncio
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.core.catalog import SUPPORTED_ASSETS, SUPPORTED_SOURCES, SUPPORTED_STRATEGIES, SUPPORTED_TIMEFRAMES
from app.schemas.market import (
    ReplayResponse,
    StrategyLeaderboardResponse,
    WatchlistItem,
)
from app.services.market_data import fetch_candles
from app.services.strategies import build_replay, build_strategy_leaderboard

router = APIRouter(tags=["market"])


@router.get("/market/replay", response_model=ReplayResponse)
async def market_replay(
    source: str = Query("binance-spot"),
    symbol: str = Query("BTCUSDT"),
    timeframe: str = Query("1d"),
    strategy: str = Query("ema-regime"),
    limit: int = Query(1000, ge=90, le=1500),
    end_time: Optional[str] = Query(None),
) -> ReplayResponse:
    _validate_query(source=source, symbol=symbol, timeframe=timeframe, strategy=strategy)
    candles = await fetch_candles(source_id=source, symbol=symbol, timeframe=timeframe, limit=limit, end_time=end_time)
    return build_replay(
        source_id=source,
        symbol=symbol,
        timeframe=timeframe,
        strategy_id=strategy,
        candles=candles,
    )


@router.get("/market/watchlist", response_model=list[WatchlistItem])
async def market_watchlist(
    source: str = Query("binance-spot"),
    timeframe: str = Query("1d"),
    strategy: str = Query("ema-regime"),
) -> list[WatchlistItem]:
    _validate_query(source=source, symbol="BTCUSDT", timeframe=timeframe, strategy=strategy)

    async def build_item(symbol: str) -> WatchlistItem:
        candles = await fetch_candles(source_id=source, symbol=symbol, timeframe=timeframe, limit=120)
        replay = build_replay(
            source_id=source,
            symbol=symbol,
            timeframe=timeframe,
            strategy_id=strategy,
            candles=candles,
        )
        previous = candles[-2].close
        latest = candles[-1].close
        change_pct = ((latest / previous) - 1.0) * 100 if previous else 0.0
        return WatchlistItem(
            symbol=symbol,
            source_id=source,
            last_close=round(latest, 4),
            change_pct=round(change_pct, 2),
            strategy_bias=replay.stats.strategy_bias,
            confidence=replay.stats.confidence,
        )

    return await asyncio.gather(
        *(build_item(symbol) for symbol in SUPPORTED_ASSETS.keys())
    )


@router.get("/market/leaderboard", response_model=StrategyLeaderboardResponse)
async def market_leaderboard(
    source: str = Query("binance-spot"),
    symbol: str = Query("BTCUSDT"),
    timeframe: str = Query("1d"),
    limit: int = Query(1000, ge=90, le=1000),
) -> StrategyLeaderboardResponse:
    _validate_market_query(source=source, symbol=symbol, timeframe=timeframe)
    candles = await fetch_candles(
        source_id=source,
        symbol=symbol,
        timeframe=timeframe,
        limit=limit,
    )
    return build_strategy_leaderboard(
        source_id=source,
        symbol=symbol,
        timeframe=timeframe,
        candles=candles,
    )


def _validate_query(source: str, symbol: str, timeframe: str, strategy: str) -> None:
    _validate_market_query(source=source, symbol=symbol, timeframe=timeframe)
    _validate_strategy(strategy=strategy)


def _validate_market_query(source: str, symbol: str, timeframe: str) -> None:
    if source not in SUPPORTED_SOURCES:
        raise HTTPException(status_code=400, detail=f"Unsupported source: {source}")
    if symbol not in SUPPORTED_ASSETS:
        raise HTTPException(status_code=400, detail=f"Unsupported symbol: {symbol}")
    if timeframe not in SUPPORTED_TIMEFRAMES:
        raise HTTPException(status_code=400, detail=f"Unsupported timeframe: {timeframe}")


def _validate_strategy(strategy: str) -> None:
    if strategy not in SUPPORTED_STRATEGIES:
        raise HTTPException(status_code=400, detail=f"Unsupported strategy: {strategy}")
