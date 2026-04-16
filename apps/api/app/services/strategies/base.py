from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Literal

from app.schemas.market import Candle

StrategyBias = Literal["bullish", "neutral", "defensive"]


@dataclass
class StrategyOutcome:
    overlay_label: str
    overlay_values: list[float | None]
    entries: list[bool]
    exits: list[bool]
    bias: StrategyBias
    confidence: float


StrategyRunner = Callable[[str, list[Candle]], StrategyOutcome]
