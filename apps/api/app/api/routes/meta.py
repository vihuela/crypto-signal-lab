from fastapi import APIRouter

from app.core.catalog import SUPPORTED_ASSETS, SUPPORTED_SOURCES, SUPPORTED_STRATEGIES
from app.schemas.meta import AssetOption, DataSourceOption, StrategySummary

router = APIRouter(tags=["meta"])


@router.get("/sources", response_model=list[DataSourceOption])
def list_sources() -> list[DataSourceOption]:
    return [
        DataSourceOption(
            id=source_id,
            label=payload["label"],
            market_type="spot",
            cadence="daily and weekly candles",
        )
        for source_id, payload in SUPPORTED_SOURCES.items()
    ]


@router.get("/assets", response_model=list[AssetOption])
def list_assets() -> list[AssetOption]:
    return [
        AssetOption(
            symbol=symbol,
            label=payload["label"],
            category=payload["category"],
            default_source=payload["default_source"],
        )
        for symbol, payload in SUPPORTED_ASSETS.items()
    ]


@router.get("/strategies", response_model=list[StrategySummary])
def list_strategies() -> list[StrategySummary]:
    return [
        StrategySummary(
            id=strategy_id,
            label=payload["label"],
            style=payload["style"],
            timeframe="1d / 1w",
            status="ready",
        )
        for strategy_id, payload in SUPPORTED_STRATEGIES.items()
    ]
