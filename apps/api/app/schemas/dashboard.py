from pydantic import BaseModel


class MetricCard(BaseModel):
    label: str
    value: str
    change: str
    tone: str


class DashboardSnapshot(BaseModel):
    title: str
    subtitle: str
    active_symbol: str
    active_source: str
    active_strategy: str
    metrics: list[MetricCard]
