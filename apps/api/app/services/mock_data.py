from app.schemas.dashboard import DashboardSnapshot, MetricCard
from app.schemas.meta import AssetOption, DataSourceOption, StrategySummary


def get_data_sources() -> list[DataSourceOption]:
    return [
        DataSourceOption(
            id="binance-spot",
            label="Binance Spot",
            market_type="spot",
            cadence="daily and weekly candles",
        ),
        DataSourceOption(
            id="bybit-spot",
            label="Bybit Spot",
            market_type="spot",
            cadence="daily and weekly candles",
        ),
    ]


def get_assets() -> list[AssetOption]:
    return [
        AssetOption(
            symbol="BTCUSDT",
            label="Bitcoin",
            category="store of value",
            default_source="binance-spot",
        ),
        AssetOption(
            symbol="ETHUSDT",
            label="Ethereum",
            category="smart contract layer",
            default_source="binance-spot",
        ),
        AssetOption(
            symbol="SOLUSDT",
            label="Solana",
            category="high beta layer 1",
            default_source="bybit-spot",
        ),
        AssetOption(
            symbol="DOGEUSDT",
            label="Dogecoin",
            category="meme beta",
            default_source="bybit-spot",
        ),
    ]


def get_strategies() -> list[StrategySummary]:
    return [
        StrategySummary(
            id="ema-regime",
            label="EMA Regime",
            style="trend following",
            timeframe="1d",
            status="ready",
        ),
        StrategySummary(
            id="donchian-breakout",
            label="Donchian Breakout",
            style="weekly trend",
            timeframe="1w",
            status="ready",
        ),
        StrategySummary(
            id="rsi-bollinger-swing",
            label="RSI Bollinger Swing",
            style="mean reversion",
            timeframe="1d",
            status="ready",
        ),
        StrategySummary(
            id="supertrend-atr",
            label="Supertrend ATR",
            style="volatility trend",
            timeframe="1d / 1w",
            status="ready",
        ),
        StrategySummary(
            id="ichimoku-cloud",
            label="Ichimoku Cloud",
            style="trend confirmation",
            timeframe="1d / 1w",
            status="ready",
        ),
        StrategySummary(
            id="parabolic-sar",
            label="Parabolic SAR",
            style="stop and reverse",
            timeframe="1d / 1w",
            status="ready",
        ),
        StrategySummary(
            id="community-adapter",
            label="Community Strategy Adapter",
            style="custom import",
            timeframe="1d / 1w",
            status="waiting for spec",
        ),
    ]


def get_dashboard_snapshot() -> DashboardSnapshot:
    return DashboardSnapshot(
        title="Crypto Signal Lab",
        subtitle="Local spot research terminal for elegant replay and strategy validation.",
        active_symbol="BTCUSDT",
        active_source="Binance Spot",
        active_strategy="EMA Regime",
        metrics=[
            MetricCard(
                label="Rolling edge",
                value="+11.8%",
                change="vs buy and hold +4.1%",
                tone="positive",
            ),
            MetricCard(
                label="Max drawdown",
                value="-13.4%",
                change="contained over last 2 years",
                tone="neutral",
            ),
            MetricCard(
                label="Forecast bias",
                value="Bullish",
                change="1d confidence 0.68",
                tone="positive",
            ),
            MetricCard(
                label="Data freshness",
                value="Synced",
                change="Binance 04:00 UTC close",
                tone="neutral",
            ),
        ],
    )
