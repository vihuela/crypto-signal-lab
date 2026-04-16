from __future__ import annotations

import argparse
import asyncio
import json
import sys
from collections import defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.core.catalog import SUPPORTED_ASSETS, SUPPORTED_STRATEGIES
from app.services.market_data import fetch_candles
from app.services.strategies import build_replay


@dataclass
class BenchmarkRow:
    symbol: str
    source_id: str
    timeframe: str
    strategy_id: str
    strategy_label: str
    candles: int
    start: str
    end: str
    total_return_pct: float
    buy_hold_return_pct: float
    edge_vs_hold_pct: float
    max_drawdown_pct: float
    win_rate_pct: float
    trade_count: int
    strategy_bias: str
    confidence: float


async def _run_case(
    source_id: str,
    symbol: str,
    timeframe: str,
    strategy_id: str,
    limit: int,
) -> BenchmarkRow:
    candles = await fetch_candles(
        source_id=source_id,
        symbol=symbol,
        timeframe=timeframe,
        limit=limit,
    )
    replay = build_replay(
        source_id=source_id,
        symbol=symbol,
        timeframe=timeframe,
        strategy_id=strategy_id,
        candles=candles,
    )

    return BenchmarkRow(
        symbol=symbol,
        source_id=source_id,
        timeframe=timeframe,
        strategy_id=strategy_id,
        strategy_label=replay.strategy_label,
        candles=len(candles),
        start=candles[0].time,
        end=candles[-1].time,
        total_return_pct=replay.stats.total_return_pct,
        buy_hold_return_pct=replay.stats.buy_hold_return_pct,
        edge_vs_hold_pct=round(
            replay.stats.total_return_pct - replay.stats.buy_hold_return_pct, 2
        ),
        max_drawdown_pct=replay.stats.max_drawdown_pct,
        win_rate_pct=replay.stats.win_rate_pct,
        trade_count=replay.stats.trade_count,
        strategy_bias=replay.stats.strategy_bias,
        confidence=replay.stats.confidence,
    )


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Run batch strategy backtests on live exchange candles."
    )
    parser.add_argument(
        "--symbols",
        nargs="*",
        default=list(SUPPORTED_ASSETS.keys()),
        help="Symbols to benchmark, e.g. BTCUSDT ETHUSDT",
    )
    parser.add_argument(
        "--timeframes",
        nargs="*",
        default=["1d", "1w"],
        help="Timeframes to benchmark, e.g. 1d 1w",
    )
    parser.add_argument(
        "--strategies",
        nargs="*",
        default=list(SUPPORTED_STRATEGIES.keys()),
        help="Strategy ids to benchmark",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=1000,
        help="Number of candles to request per dataset",
    )
    parser.add_argument(
        "--source-override",
        default=None,
        help="Force a single source id for every symbol, e.g. binance-spot",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print raw JSON instead of the human summary",
    )
    return parser


def _print_human_report(rows: list[BenchmarkRow]) -> None:
    print("== Strategy Benchmark ==")
    if not rows:
        print("No benchmark rows produced.")
        return

    first = rows[0]
    print(
        f"Universe: {len({row.symbol for row in rows})} assets, "
        f"{len({row.timeframe for row in rows})} timeframes, "
        f"{len({row.strategy_id for row in rows})} strategies"
    )
    print(
        f"Latest window: {first.start} -> {first.end} "
        f"(sample varies slightly by symbol/source)"
    )
    print()

    grouped_runs: dict[tuple[str, str], list[BenchmarkRow]] = defaultdict(list)
    for row in rows:
        grouped_runs[(row.symbol, row.timeframe)].append(row)

    for (symbol, timeframe), group in sorted(grouped_runs.items()):
        group.sort(key=lambda item: item.total_return_pct, reverse=True)
        print(f"[{symbol} {timeframe}]")
        for index, row in enumerate(group[:3], start=1):
            print(
                f"{index}. {row.strategy_label:<18} "
                f"return {row.total_return_pct:>8.2f}% | "
                f"vs hold {row.edge_vs_hold_pct:>8.2f}% | "
                f"drawdown {row.max_drawdown_pct:>7.2f}% | "
                f"trades {row.trade_count:>3}"
            )
        print()

    grouped_strategies: dict[str, list[BenchmarkRow]] = defaultdict(list)
    for row in rows:
        grouped_strategies[row.strategy_id].append(row)

    print("[Aggregate by strategy]")
    aggregates = []
    for strategy_id, group in grouped_strategies.items():
        count = len(group)
        average_return = sum(item.total_return_pct for item in group) / count
        average_edge = sum(item.edge_vs_hold_pct for item in group) / count
        average_drawdown = sum(item.max_drawdown_pct for item in group) / count
        profitable_runs = sum(1 for item in group if item.total_return_pct > 0)
        aggregates.append(
            (
                average_return,
                strategy_id,
                group[0].strategy_label,
                average_edge,
                average_drawdown,
                profitable_runs,
                count,
            )
        )

    for (
        average_return,
        _strategy_id,
        strategy_label,
        average_edge,
        average_drawdown,
        profitable_runs,
        count,
    ) in sorted(aggregates, reverse=True):
        print(
            f"- {strategy_label:<18} avg return {average_return:>8.2f}% | "
            f"avg vs hold {average_edge:>8.2f}% | "
            f"avg drawdown {average_drawdown:>7.2f}% | "
            f"profitable runs {profitable_runs}/{count}"
        )


async def _main() -> None:
    parser = _build_parser()
    args = parser.parse_args()

    rows: list[BenchmarkRow] = []
    for symbol in args.symbols:
        if symbol not in SUPPORTED_ASSETS:
            raise ValueError(f"Unsupported symbol: {symbol}")

        source_id = args.source_override or SUPPORTED_ASSETS[symbol]["default_source"]
        for timeframe in args.timeframes:
            for strategy_id in args.strategies:
                if strategy_id not in SUPPORTED_STRATEGIES:
                    raise ValueError(f"Unsupported strategy: {strategy_id}")
                rows.append(
                    await _run_case(
                        source_id=source_id,
                        symbol=symbol,
                        timeframe=timeframe,
                        strategy_id=strategy_id,
                        limit=args.limit,
                    )
                )

    if args.json:
        print(json.dumps([asdict(row) for row in rows], indent=2))
        return

    _print_human_report(rows)


if __name__ == "__main__":
    asyncio.run(_main())
