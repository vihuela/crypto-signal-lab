"use client";

import { useEffect, useState } from "react";
import { Bot, DatabaseZap, Radar, Waves } from "lucide-react";

import { fetchReplay, fetchWatchlist } from "@/features/dashboard/api";
import {
  replayLimitByTimeframe,
  sourceOptions,
  strategyOptions,
  symbolOptions,
  timeframeOptions,
} from "@/features/dashboard/dashboard-config";
import { ControlSelect } from "@/features/dashboard/components/control-select";
import { LanguageToggle } from "@/features/dashboard/components/language-toggle";
import { MarketStageChart } from "@/features/dashboard/components/market-stage-chart";
import type {
  ReplayResponse,
  SourceId,
  StrategyId,
  Timeframe,
  WatchlistItem,
} from "@/features/dashboard/types";
import { useLocale } from "@/features/i18n/locale-provider";

const defaultSource: SourceId = "binance-spot";
const defaultSymbol = "BTCUSDT";
const defaultTimeframe: Timeframe = "1d";
const defaultStrategy: StrategyId = "ema-regime";
const LIVE_REFRESH_MS = 15_000;

export function DashboardShell() {
  const { locale, setLocale, dictionary } = useLocale();
  const [source, setSource] = useState<SourceId>(defaultSource);
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [timeframe, setTimeframe] = useState<Timeframe>(defaultTimeframe);
  const [strategy, setStrategy] = useState<StrategyId>(defaultStrategy);
  const [replay, setReplay] = useState<ReplayResponse | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let refreshTimerId: number | null = null;
    let requestSequence = 0;

    async function load(backgroundRefresh: boolean) {
      const requestId = ++requestSequence;

      if (backgroundRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      try {
        const [replayData, watchlistData] = await Promise.all([
          fetchReplay({
            source,
            symbol,
            timeframe,
            strategy,
            limit: replayLimitByTimeframe[timeframe],
          }),
          fetchWatchlist({
            source,
            timeframe,
            strategy,
          }),
        ]);

        if (!cancelled && requestId === requestSequence) {
          setReplay(replayData);
          setWatchlist(watchlistData);
          setError(null);
          setLastUpdatedAt(new Date().toISOString());
        }
      } catch (loadError) {
        if (!cancelled && requestId === requestSequence) {
          setError(
            loadError instanceof Error ? loadError.message : dictionary.cards.error
          );
        }
      } finally {
        if (!cancelled && requestId === requestSequence) {
          if (backgroundRefresh) {
            setIsRefreshing(false);
          } else {
            setIsLoading(false);
          }
        }

        if (!cancelled && requestId === requestSequence) {
          refreshTimerId = window.setTimeout(() => {
            void load(true);
          }, LIVE_REFRESH_MS);
        }
      }
    }

    void load(false);

    return () => {
      cancelled = true;
      if (refreshTimerId) {
        window.clearTimeout(refreshTimerId);
      }
    };
  }, [dictionary.cards.error, source, symbol, timeframe, strategy]);

  const marketCopy = dictionary;
  const lastUpdatedLabel = lastUpdatedAt ? formatTime(lastUpdatedAt, locale) : null;
  const replayWindowSummary = replay
    ? formatReplayWindow({
        candles: replay.candles,
        timeframeLabel: marketCopy.timeframes[timeframe],
        candlesLabel: marketCopy.stats.candles,
        locale,
      })
    : null;
  const replayMetrics = replay
    ? [
        {
          tone: "primary" as const,
          label: marketCopy.stats.strategyReturn,
          value: formatPercent(replay.stats.total_return_pct, locale),
          lines: [
            replayWindowSummary?.dateRange,
            replayWindowSummary?.meta,
            `${marketCopy.stats.vsBuyHold} ${formatPercent(
              replay.stats.buy_hold_return_pct,
              locale
            )}`,
          ].filter(Boolean),
        },
        {
          tone: "primary" as const,
          label: marketCopy.cards.drawdown,
          value: formatPercent(replay.stats.max_drawdown_pct, locale),
          lines: [
            replayWindowSummary?.dateRange,
            replayWindowSummary?.meta ?? marketCopy.cards.normalized,
          ].filter(Boolean),
        },
        {
          tone: "secondary" as const,
          label: marketCopy.cards.bias,
          value: `${marketCopy.bias[replay.stats.strategy_bias]} ${replay.stats.confidence.toFixed(
            2
          )}`,
          lines: [
            `${marketCopy.stats.confidencePrefix} ${replay.stats.confidence.toFixed(2)}`,
          ],
        },
        {
          tone: "secondary" as const,
          label: marketCopy.cards.freshness,
          value: isRefreshing ? marketCopy.stats.refreshing : marketCopy.stats.synced,
          lines: [
            lastUpdatedLabel
              ? `${marketCopy.stats.updatedAt} ${lastUpdatedLabel}`
              : marketCopy.stats.dailyClose,
          ],
        },
      ]
    : [
        {
          tone: "primary" as const,
          label: marketCopy.cards.loading,
          value: "…",
          lines: [marketCopy.cards.retryHint],
        },
      ];
  const primaryReplayMetrics = replayMetrics.filter(
    (card) => card.tone === "primary"
  );
  const secondaryReplayMetrics = replayMetrics.filter(
    (card) => card.tone === "secondary"
  );

  const translatedSourceOptions = sourceOptions.map((option) => ({
    value: option.value,
    label: marketCopy.sources[option.value],
  }));
  const translatedSymbolOptions = symbolOptions.map((option) => ({
    value: option.value,
    label: marketCopy.assets[option.value],
  }));
  const translatedTimeframeOptions = timeframeOptions.map((option) => ({
    value: option.value,
    label: marketCopy.timeframes[option.value],
  }));
  const translatedStrategyOptions = strategyOptions.map((option) => ({
    value: option.value,
    label: marketCopy.strategies[option.value].label,
    disabled: option.disabled,
  }));

  return (
    <main className="data-grid min-h-screen px-5 py-6 text-[#f5eee4] md:px-8 xl:px-10">
      <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-white/8 bg-black/22 px-6 py-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl md:px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl xl:max-w-4xl">
              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-white/54">
                <span className="rounded-full border border-white/10 px-3 py-1">
                  {marketCopy.nav.researchTerminal}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1">
                  {marketCopy.nav.spotOnly}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1">
                  {marketCopy.nav.timeframes}
                </span>
              </div>
              <h1 className="display-face max-w-4xl text-4xl leading-[0.95] tracking-[-0.04em] text-[#f8f3ec] sm:text-5xl lg:text-6xl">
                {marketCopy.hero.title}
                <span className="block text-white/52">
                  {marketCopy.hero.subtitle}
                </span>
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/62">
                {marketCopy.hero.description}
              </p>
            </div>

            <div className="self-start">
              <LanguageToggle
                label={marketCopy.nav.language}
                locale={locale}
                onChange={setLocale}
              />
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(300px,0.7fr)]">
            {primaryReplayMetrics.map((card) => (
              <article
                key={card.label}
                className="rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] px-5 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)] md:px-6 md:py-5"
              >
                <p className="text-[0.7rem] uppercase tracking-[0.24em] text-white/34">
                  {card.label}
                </p>
                <p className="mt-3 text-[2.2rem] font-semibold leading-none tracking-[-0.04em] text-[#f8f2e8] md:text-[2.85rem]">
                  {card.value}
                </p>
                <div className="mt-4 space-y-1.5">
                  {card.lines.map((line, index) => (
                    <p
                      key={line}
                      className={`leading-5 ${
                        index === 0
                          ? "text-[1rem] text-white/68"
                          : "text-[0.92rem] text-white/48"
                      }`}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </article>
            ))}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {secondaryReplayMetrics.map((card) => (
                  <article
                    key={card.label}
                    className="rounded-[1.5rem] border border-white/8 bg-white/4 px-4 py-3 md:px-5 md:py-4"
                  >
                    <p className="text-[0.68rem] uppercase tracking-[0.24em] text-white/36">
                      {card.label}
                    </p>
                    <p className="mt-2 text-[1.65rem] font-semibold leading-none tracking-[-0.03em] text-[#f8f2e8] md:text-[1.8rem]">
                      {card.value}
                    </p>
                    <div className="mt-2 space-y-1">
                      {card.lines.map((line) => (
                        <p key={line} className="text-[0.92rem] leading-5 text-white/52">
                          {line}
                        </p>
                      ))}
                    </div>
                  </article>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <ControlSelect
              label={marketCopy.controls.source}
              value={source}
              options={translatedSourceOptions}
              onChange={(value) => setSource(value as SourceId)}
            />
            <ControlSelect
              label={marketCopy.controls.pair}
              value={symbol}
              options={translatedSymbolOptions}
              onChange={setSymbol}
            />
            <ControlSelect
              label={marketCopy.controls.timeframe}
              value={timeframe}
              options={translatedTimeframeOptions}
              onChange={(value) => setTimeframe(value as Timeframe)}
            />
            <ControlSelect
              label={marketCopy.controls.strategy}
              value={strategy}
              options={translatedStrategyOptions}
              onChange={(value) => setStrategy(value as StrategyId)}
            />
            <div className="rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/88 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-sm">
              <span className="mb-2 block text-[0.68rem] uppercase tracking-[0.24em] text-white/38">
                API
              </span>
              <p className="font-medium tracking-[0.03em] text-white/92">
                FastAPI orchestration
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_380px]">
          <MarketStageChart
            candles={replay?.candles ?? []}
            overlay={replay?.overlay ?? []}
            overlayLabel={replay?.overlay_label ?? "Overlay"}
            markers={replay?.markers ?? []}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            resetKey={`${source}:${symbol}:${timeframe}:${strategy}`}
            symbolLabel={marketCopy.assets[symbol as keyof typeof marketCopy.assets]}
            sourceLabel={marketCopy.sources[source]}
            timeframeLabel={marketCopy.timeframes[timeframe]}
            strategyLabel={
              marketCopy.strategies[strategy as keyof typeof marketCopy.strategies].label
            }
            locale={locale}
            markerText={marketCopy.markers}
            loadingLabel={marketCopy.cards.loading}
            liveBadgeLabel={`${marketCopy.stats.live} · ${marketCopy.stats.autoRefresh}`}
            refreshBadgeLabel={marketCopy.stats.refreshing}
            lastUpdatedLabel={
              lastUpdatedLabel
                ? `${marketCopy.stats.updatedAt} ${lastUpdatedLabel}`
                : null
            }
            interactionHint={marketCopy.stats.zoomHint}
          />

          <aside className="grid gap-6">
            <section className="rounded-[2rem] border border-white/8 bg-[#111317] px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.7rem] uppercase tracking-[0.26em] text-white/34">
                    {marketCopy.sections.sessionBias}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[#f7efe5]">
                    {replay
                      ? marketCopy.bias[replay.stats.strategy_bias]
                      : marketCopy.cards.loading}
                  </h2>
                </div>
                <Radar className="mt-1 h-5 w-5 text-[#8fb2ff]" />
              </div>

              <p className="mt-4 text-base leading-7 text-white/58">
                {replay
                  ? `${marketCopy.strategies[strategy].style} · ${marketCopy.stats.confidencePrefix} ${replay.stats.confidence.toFixed(2)}`
                  : marketCopy.cards.retryHint}
              </p>

              <div className="mt-6 grid gap-3">
                <div className="rounded-[1.4rem] bg-white/4 p-4">
                  <p className="text-sm text-white/42">
                    {marketCopy.cards.confidence}
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-white/8">
                    <div
                      className="h-2 rounded-full bg-[#90b3ff]"
                      style={{
                        width: `${Math.max(
                          8,
                          Math.round((replay?.stats.confidence ?? 0) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-white/62">
                    {replay
                      ? `${marketCopy.stats.confidencePrefix} ${replay.stats.confidence.toFixed(
                          2
                        )}`
                      : marketCopy.cards.loading}
                  </p>
                </div>

                <div className="rounded-[1.4rem] bg-white/4 p-4">
                  <p className="text-sm text-white/42">{marketCopy.cards.researchMode}</p>
                  <p className="mt-2 text-xl font-semibold text-[#f7efe5]">
                    {marketCopy.cards.localOnly}
                  </p>
                  <p className="mt-2 text-sm text-white/56">{marketCopy.cards.noLive}</p>
                </div>

                {error ? (
                  <div className="rounded-[1.4rem] bg-[#2a1816] p-4 text-sm text-[#f4c2b0]">
                    <p className="font-semibold">{marketCopy.cards.error}</p>
                    <p className="mt-2">{error}</p>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/8 bg-[#111317] px-5 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[0.7rem] uppercase tracking-[0.26em] text-white/34">
                    {marketCopy.sections.watchStack}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-[#f7efe5]">
                    {marketCopy.watch.currentFocus}
                  </h2>
                </div>
                <Waves className="h-5 w-5 text-[#d29d73]" />
              </div>
              <p className="mt-3 text-sm leading-6 text-white/52">
                {marketCopy.watch.currentFocusSubtitle}
              </p>
              <div className="mt-4 space-y-3">
                {watchlist.map((asset) => (
                  <div
                    key={asset.symbol}
                    className="flex items-center justify-between rounded-[1.2rem] bg-white/4 px-4 py-3"
                  >
                    <div>
                      <p className="text-base font-semibold text-[#f8f2e8]">
                        {marketCopy.assets[asset.symbol as keyof typeof marketCopy.assets]}
                      </p>
                      <p className="text-sm text-white/48">
                        {marketCopy.sources[asset.source_id]} ·{" "}
                        {marketCopy.bias[asset.strategy_bias]}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-[#f8f2e8]">
                        {formatUsd(asset.last_close, locale)}
                      </p>
                      <p
                        className={`text-sm ${
                          asset.change_pct >= 0 ? "text-[#9ed8bf]" : "text-[#f0a987]"
                        }`}
                      >
                        {formatPercent(asset.change_pct, locale)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
          <section className="rounded-[2rem] border border-white/8 bg-[#111317] px-6 py-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.26em] text-white/34">
                  {marketCopy.sections.strategyRack}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#f7efe5]">
                  {marketCopy.hero.title}
                </h2>
              </div>
              <Bot className="h-5 w-5 text-[#8fb2ff]" />
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {strategyOptions.map((strategyOption) => {
                const copy = marketCopy.strategies[strategyOption.value];
                return (
                  <article
                    key={strategyOption.value}
                    className="rounded-[1.5rem] bg-white/4 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-[#f7efe5]">
                          {copy.label}
                        </p>
                        <p className="mt-1 text-sm text-white/48">{copy.style}</p>
                      </div>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/48">
                        {strategyOption.disabled
                          ? marketCopy.cards.waiting
                          : marketCopy.cards.available}
                      </span>
                    </div>
                    <p className="mt-4 max-w-[32ch] text-sm leading-6 text-white/58">
                      {copy.thesis}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="grid gap-6">
            <section className="rounded-[2rem] border border-white/8 bg-[#111317] px-6 py-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[0.7rem] uppercase tracking-[0.26em] text-white/34">
                    {marketCopy.sections.dataProvenance}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[#f7efe5]">
                    {marketCopy.sources[source]}
                  </h2>
                </div>
                <DatabaseZap className="h-5 w-5 text-[#d29d73]" />
              </div>
              <div className="mt-4 space-y-3">
                {translatedSourceOptions.map((sourceOption) => (
                  <div
                    key={sourceOption.value}
                    className="flex items-center justify-between rounded-[1.3rem] bg-white/4 px-4 py-4"
                  >
                    <div>
                      <p className="font-semibold text-[#f7efe5]">{sourceOption.label}</p>
                      <p className="text-sm text-white/48">{marketCopy.cards.normalized}</p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/48">
                      {marketCopy.cards.active}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/8 bg-[#111317] px-6 py-6">
              <p className="text-[0.7rem] uppercase tracking-[0.26em] text-white/34">
                {marketCopy.sections.clearBoundaries}
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-white/58">
                {marketCopy.architecture.map((note) => (
                  <li key={note} className="rounded-[1.1rem] bg-white/4 px-4 py-3">
                    {note}
                  </li>
                ))}
              </ul>
            </section>
          </section>
        </section>
      </div>
    </main>
  );
}

function formatUsd(value: number, locale: "en" | "zh") {
  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : value >= 1 ? 2 : 4,
  }).format(value);
}

function formatPercent(value: number, locale: "en" | "zh") {
  const formatter = new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: "always",
  });
  return `${formatter.format(value)}%`;
}

function formatTime(value: string, locale: "en" | "zh") {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatReplayWindow({
  candles,
  timeframeLabel,
  candlesLabel,
  locale,
}: {
  candles: ReplayResponse["candles"];
  timeframeLabel: string;
  candlesLabel: string;
  locale: "en" | "zh";
}) {
  if (candles.length === 0) {
    return null;
  }

  const start = formatDate(candles[0].time, locale);
  const end = formatDate(candles[candles.length - 1].time, locale);
  return {
    dateRange: `${start} - ${end}`,
    meta: `${candles.length} ${candlesLabel} · ${timeframeLabel}`,
  };
}

function formatDate(value: string, locale: "en" | "zh") {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).format(date);
}
