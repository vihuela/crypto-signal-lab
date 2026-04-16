from typing import Final

SUPPORTED_SOURCES: Final[dict[str, dict[str, str]]] = {
    "binance-spot": {
        "label": "Binance Spot",
        "base_url": "https://api.binance.com",
    },
    "bybit-spot": {
        "label": "Bybit Spot",
        "base_url": "https://api.bybit.com",
    },
}

SUPPORTED_TIMEFRAMES: Final[dict[str, dict[str, str]]] = {
    "1d": {
        "label": "1D",
        "binance": "1d",
        "bybit": "D",
    },
    "1w": {
        "label": "1W",
        "binance": "1w",
        "bybit": "W",
    },
}

SUPPORTED_ASSETS: Final[dict[str, dict[str, str]]] = {
    "BTCUSDT": {
        "label": "Bitcoin",
        "category": "store of value",
        "default_source": "binance-spot",
    },
    "ETHUSDT": {
        "label": "Ethereum",
        "category": "smart contract layer",
        "default_source": "binance-spot",
    },
    "SOLUSDT": {
        "label": "Solana",
        "category": "high beta layer 1",
        "default_source": "bybit-spot",
    },
    "DOGEUSDT": {
        "label": "Dogecoin",
        "category": "meme beta",
        "default_source": "bybit-spot",
    },
}

SUPPORTED_STRATEGIES: Final[dict[str, dict[str, str]]] = {
    "ema-regime": {
        "label": "EMA Regime",
        "style": "trend following",
    },
    "donchian-breakout": {
        "label": "Donchian Breakout",
        "style": "weekly trend",
    },
    "rsi-bollinger-swing": {
        "label": "RSI Bollinger Swing",
        "style": "mean reversion",
    },
}
