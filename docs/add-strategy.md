# 新增策略说明

这份文档给以后新增策略时使用。现在项目已经把策略层拆成了“注册表 + 单策略文件 + 指标工具 + 回测器”的结构，后续不需要再把所有逻辑都堆进一个文件里。

## 当前策略结构

后端策略代码位置：

- `apps/api/app/services/strategies/__init__.py`
- `apps/api/app/services/strategies/registry.py`
- `apps/api/app/services/strategies/backtest.py`
- `apps/api/app/services/strategies/indicators.py`
- `apps/api/app/services/strategies/ema_regime.py`
- `apps/api/app/services/strategies/donchian_breakout.py`
- `apps/api/app/services/strategies/rsi_bollinger_swing.py`
- `apps/api/app/services/strategies/supertrend_atr.py`
- `apps/api/app/services/strategies/ichimoku_cloud.py`
- `apps/api/app/services/strategies/parabolic_sar.py`
- `apps/api/scripts/run_strategy_benchmarks.py`

相关配置位置：

- `apps/api/app/core/catalog.py`
- `apps/api/app/api/routes/market.py`
- `apps/web/src/features/dashboard/dashboard-config.ts`
- `apps/web/src/features/i18n/dictionaries.ts`

## 新增一个策略要改哪些地方

后端最少需要改 3 个位置：

1. 新建一个策略文件
   例如：`apps/api/app/services/strategies/my_new_strategy.py`

2. 在注册表注册它
   文件：`apps/api/app/services/strategies/registry.py`

3. 在策略目录元数据里补充展示信息
   文件：`apps/api/app/core/catalog.py`

如果要在前端下拉和文案里显示，还需要改 2 个位置：

4. 前端策略选项
   文件：`apps/web/src/features/dashboard/dashboard-config.ts`

5. 中英文文案
   文件：`apps/web/src/features/i18n/dictionaries.ts`

## 单个策略文件建议模板

```python
from __future__ import annotations

from app.schemas.market import Candle

from .base import StrategyContext, StrategyOutcome


def run(
    timeframe: str,
    candles: list[Candle],
    context: StrategyContext | None = None,
) -> StrategyOutcome:
    closes = [candle.close for candle in candles]

    entries = [False] * len(candles)
    exits = [False] * len(candles)

    # 在这里写你的策略逻辑
    # 1. 计算指标
    # 2. 逐根K线生成 entries / exits
    # 3. 给出 overlay_values
    # 4. 给出 bias / confidence

    return StrategyOutcome(
        overlay_label="Your Overlay",
        overlay_values=[None] * len(candles),
        entries=entries,
        exits=exits,
        bias="neutral",
        confidence=0.0,
    )
```

## 需要输出什么

每个策略最终都要输出这 6 个东西：

- `overlay_label`
  图表辅助线名称，比如 `Slow EMA`

- `overlay_values`
  跟每根 K 线等长的辅助线序列，没有值的位置填 `None`

- `entries`
  跟每根 K 线等长的布尔数组，`True` 表示该根 K 线触发买入

- `exits`
  跟每根 K 线等长的布尔数组，`True` 表示该根 K 线触发离场

- `bias`
  只能是：`bullish` / `neutral` / `defensive`

- `confidence`
  0 到 1 之间的小数，用来在前端显示当前信号强度

## 建议的拆分原则

如果策略里要复用通用指标，优先放进：

- `apps/api/app/services/strategies/indicators.py`

如果策略要接额外数据源，例如链上指标、ETF 资金流、宏观序列，优先放进：

- `apps/api/app/services/factor_data.py`

然后通过 `context` 传给策略，不要把联网请求直接写进单个策略文件。

如果是所有策略共享的回测收益计算，放进：

- `apps/api/app/services/strategies/backtest.py`

不要把某个策略特有的入场离场规则写进 `indicators.py`。

## 后续给 Codex 新增策略时，建议提供这些信息

最少给下面这些就够了：

1. 策略名称
2. 策略用途
3. 适用品种
4. 适用周期
5. 是否只做现货做多
6. 入场条件
7. 离场条件
8. 需要的指标和参数
9. 图上要显示什么辅助线
10. 信号强度怎么定义

## 推荐的策略描述模板

```text
策略名：
策略ID（可留空）：

适用品种：
适用周期：

方向限制：
只做多 / 可做空 / 双向

入场条件：
1.
2.
3.

离场条件：
1.
2.

指标与参数：
1.
2.

图表辅助线：

信号强度定义：

特殊规则：
例如 同时只能持有一笔、连续止损暂停、只在更大周期顺势时开仓

回测假设：
手续费：
滑点：
是否允许同根K线反手：
```

## 当前项目的接入限制

目前版本默认假设：

- 只做现货
- 先以做多策略为主
- 回测器是简化版
- 默认手续费模型固定
- 前端还没有做“策略参数动态调节”的面板

如果后续要支持：

- 多空双向
- 分批建仓 / 分批止盈
- 动态参数输入
- 多周期联动
- 多指标组合评分

建议再往前走一步，把策略参数也抽成独立 schema。
