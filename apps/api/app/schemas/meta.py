from pydantic import BaseModel


class DataSourceOption(BaseModel):
    id: str
    label: str
    market_type: str
    cadence: str


class AssetOption(BaseModel):
    symbol: str
    label: str
    category: str
    default_source: str


class StrategySummary(BaseModel):
    id: str
    label: str
    style: str
    timeframe: str
    status: str
