export type Locale = "en" | "zh";

export const dictionaries = {
  en: {
    nav: {
      researchTerminal: "Local research terminal",
      spotOnly: "Spot only",
      timeframes: "1d / 1w",
      language: "Language",
    },
    hero: {
      title: "Crypto Signal Lab",
      subtitle: "elegant replay, strategy pressure, and quiet conviction",
      description:
        "A local-first dashboard for reading BTC, ETH, SOL, and DOGE through curated spot data, restrained chart replay, and explainable strategy bias. No live execution, just a disciplined lens.",
    },
    controls: {
      source: "Source",
      pair: "Pair",
      timeframe: "Timeframe",
      strategy: "Strategy",
    },
    sections: {
      replay: "Market Replay",
      sessionBias: "Session Bias",
      watchStack: "Watch Stack",
      strategyRack: "Strategy Rack",
      dataProvenance: "Data provenance",
      clearBoundaries: "Clear boundaries",
    },
    cards: {
      rollingEdge: "Rolling edge",
      drawdown: "Max drawdown",
      bias: "Signal bias",
      freshness: "Data freshness",
      researchMode: "Research mode",
      confidence: "Signal confidence",
      loading: "Loading live market replay...",
      error: "Unable to load market data right now.",
      retryHint: "Check the API service or switch the source.",
      localOnly: "Local only",
      noLive: "no live trading, no broker execution in V1",
      active: "active",
      available: "Available now",
      waiting: "Awaiting spec",
      normalized: "spot candles, normalized in the API layer",
    },
    stats: {
      strategyReturn: "Strategy return",
      buyHold: "Buy & hold",
      winRate: "Win rate",
      trades: "Trades",
      live: "Live sync",
      autoRefresh: "15s auto refresh",
      refreshing: "Refreshing",
      updatedAt: "Updated",
      synced: "Synced",
      dailyClose: "Latest candle close synced from source",
      confidencePrefix: "confidence",
      tradesSuffix: "closed trades",
      noTrades: "No completed trades yet",
      vsBuyHold: "vs buy & hold",
      replayWindow: "Replay window",
      candles: "candles",
      zoomHint: "Wheel to zoom, drag to pan. Mac trackpad pinch gesture is enabled.",
    },
    bias: {
      bullish: "Bullish",
      neutral: "Neutral",
      defensive: "Defensive",
    },
    markers: {
      entry: "entry",
      exit: "exit",
    },
    watch: {
      currentFocus: "Current focus set",
      currentFocusSubtitle: "Source-aware reads across the default asset basket",
    },
    strategies: {
      "ema-regime": {
        label: "EMA Regime",
        style: "Trend following",
        thesis:
          "Stay long only when the market holds above the long regime average and avoid dead zones.",
      },
      "donchian-breakout": {
        label: "Donchian Breakout",
        style: "Weekly trend",
        thesis:
          "Capture slower continuation moves on BTC and ETH with sparse but high-conviction entries.",
      },
      "rsi-bollinger-swing": {
        label: "RSI Bollinger Swing",
        style: "Mean reversion",
        thesis:
          "Fade panic stretches when volatility expands but macro structure remains constructive.",
      },
      "community-adapter": {
        label: "Community Adapter",
        style: "Custom import",
        thesis:
          "Reserved for the Feishu strategy once the exact entry and exit logic is available.",
      },
    },
    sources: {
      "binance-spot": "Binance Spot",
      "bybit-spot": "Bybit Spot",
    },
    assets: {
      BTCUSDT: "BTC / USDT",
      ETHUSDT: "ETH / USDT",
      SOLUSDT: "SOL / USDT",
      DOGEUSDT: "DOGE / USDT",
    },
    timeframes: {
      "1d": "1D",
      "1w": "1W",
    },
    architecture: [
      "apps/web renders the research terminal and chart replay UI.",
      "apps/api normalizes exchange data, strategies, and forecast-ready jobs.",
      "packages/contracts is reserved for generated clients and shared response notes.",
      "infra holds the local Docker topology for Postgres, API, and the web shell.",
    ],
  },
  zh: {
    nav: {
      researchTerminal: "本地研究终端",
      spotOnly: "仅现货",
      timeframes: "日线 / 周线",
      language: "语言",
    },
    hero: {
      title: "Crypto Signal Lab",
      subtitle: "优雅回放、策略压测、克制判断",
      description:
        "这是一个本地优先的加密研究看板，用来观察 BTC、ETH、SOL、DOGE 的现货数据、回放 K 线、验证策略，并给出可解释的信号偏向。不接实盘，只做研究。",
    },
    controls: {
      source: "数据源",
      pair: "币对",
      timeframe: "周期",
      strategy: "策略",
    },
    sections: {
      replay: "市场回放",
      sessionBias: "当前偏向",
      watchStack: "观察列表",
      strategyRack: "策略仓",
      dataProvenance: "数据来源",
      clearBoundaries: "职责边界",
    },
    cards: {
      rollingEdge: "滚动优势",
      drawdown: "最大回撤",
      bias: "信号偏向",
      freshness: "数据新鲜度",
      researchMode: "运行模式",
      confidence: "信号强度",
      loading: "正在加载真实市场回放...",
      error: "暂时无法加载市场数据。",
      retryHint: "请检查 API 服务，或切换数据源再试。",
      localOnly: "仅本地",
      noLive: "V1 不接交易所下单，不做实盘执行",
      active: "已启用",
      available: "可用",
      waiting: "等待规则",
      normalized: "现货 K 线，已在 API 层统一格式",
    },
    stats: {
      strategyReturn: "策略收益",
      buyHold: "买入持有",
      winRate: "胜率",
      trades: "交易次数",
      live: "实时同步",
      autoRefresh: "每 15 秒自动刷新",
      refreshing: "更新中",
      updatedAt: "最近刷新",
      synced: "已同步",
      dailyClose: "已从数据源同步到最新收盘",
      confidencePrefix: "强度",
      tradesSuffix: "笔已完成交易",
      noTrades: "当前还没有完整平仓",
      vsBuyHold: "相对买入持有",
      replayWindow: "回放窗口",
      candles: "根 K 线",
      zoomHint: "滚轮缩放，拖拽平移。Mac 触控板双指捏合缩放已开启。",
    },
    bias: {
      bullish: "偏多",
      neutral: "中性",
      defensive: "防守",
    },
    markers: {
      entry: "入场",
      exit: "离场",
    },
    watch: {
      currentFocus: "当前关注集合",
      currentFocusSubtitle: "围绕默认资产篮子的来源感知读盘",
    },
    strategies: {
      "ema-regime": {
        label: "EMA 趋势过滤",
        style: "趋势跟随",
        thesis:
          "只有当价格站稳长期趋势均线之上时才持有，尽量避开没有方向的死区。",
      },
      "donchian-breakout": {
        label: "唐奇安突破",
        style: "周线趋势",
        thesis:
          "更适合 BTC、ETH 这种慢趋势资产，用稀疏但高确定性的方式捕捉延续行情。",
      },
      "rsi-bollinger-swing": {
        label: "RSI + 布林摆动",
        style: "均值回归",
        thesis:
          "在波动放大但大结构没有坏掉时，专门寻找日线级别的情绪拉扯和反抽机会。",
      },
      "community-adapter": {
        label: "社区策略接口",
        style: "自定义导入",
        thesis:
          "预留给飞书里的猪脚饭策略，等具体的入场与出场规则明确后再接入。",
      },
    },
    sources: {
      "binance-spot": "Binance 现货",
      "bybit-spot": "Bybit 现货",
    },
    assets: {
      BTCUSDT: "BTC / USDT",
      ETHUSDT: "ETH / USDT",
      SOLUSDT: "SOL / USDT",
      DOGEUSDT: "DOGE / USDT",
    },
    timeframes: {
      "1d": "日线",
      "1w": "周线",
    },
    architecture: [
      "apps/web 负责研究终端与图表回放界面。",
      "apps/api 负责统一交易所数据、策略计算与可接 AI 的任务编排。",
      "packages/contracts 预留给共享接口定义与生成客户端。",
      "infra 负责本地 Docker 拓扑，包括 Postgres、API 与 Web。",
    ],
  },
} as const;
