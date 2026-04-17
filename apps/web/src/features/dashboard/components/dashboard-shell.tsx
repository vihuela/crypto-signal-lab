"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Radar, Waves } from "lucide-react";

import {
  fetchReplay,
  fetchStrategyLeaderboard,
  fetchWatchlist,
} from "@/features/dashboard/api";
import {
  replayLimitByTimeframe,
  sourceOptions,
  strategyOptions,
  symbolOptions,
  timeframeOptions,
} from "@/features/dashboard/dashboard-config";
import { ControlSelect } from "@/features/dashboard/components/control-select";
import { HeroMarioTitle } from "@/features/dashboard/components/hero-mario-title";
import { LanguageToggle } from "@/features/dashboard/components/language-toggle";
import { MarketStageChart } from "@/features/dashboard/components/market-stage-chart";
import { SignalFactorsPanel } from "@/features/dashboard/components/signal-factors-panel";
import { StrategyLeaderboard } from "@/features/dashboard/components/strategy-leaderboard";
import {
  formatDatasetWindow,
  formatPercent,
  formatTime,
  formatUsd,
} from "@/features/dashboard/formatters";
import type {
  ReplayResponse,
  SourceId,
  StrategyId,
  StrategyLeaderboardResponse,
  Timeframe,
  WatchlistItem,
} from "@/features/dashboard/types";
import { useLocale } from "@/features/i18n/locale-provider";

const defaultSource: SourceId = "binance-spot";
const defaultSymbol = "BTCUSDT";
const defaultTimeframe: Timeframe = "1d";
const defaultStrategy: StrategyId = "jiayi-four-factor";
const LIVE_REFRESH_MS = 15_000;

export function DashboardShell() {
  const { locale, setLocale, dictionary } = useLocale();
  const isZh = locale === "zh";
  const [source, setSource] = useState<SourceId>(defaultSource);
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [timeframe, setTimeframe] = useState<Timeframe>(defaultTimeframe);
  const [strategy, setStrategy] = useState<StrategyId>(defaultStrategy);
  const [replay, setReplay] = useState<ReplayResponse | null>(null);
  const [dailyFactorReplay, setDailyFactorReplay] = useState<ReplayResponse | null>(
    null
  );
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<StrategyLeaderboardResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreLockRef = useRef(false);

  const handleLoadMore = useCallback(
    async (endTime: string) => {
      if (loadMoreLockRef.current || !hasMore) return;
      loadMoreLockRef.current = true;
      setIsLoadingMore(true);
      try {
        const older = await fetchReplay({
          source,
          symbol,
          timeframe,
          strategy,
          limit: replayLimitByTimeframe[timeframe],
          endTime,
        });
        if (older.candles.length < 50) {
          setHasMore(false);
        }
        setReplay((prev) => {
          if (!prev) return older;
          const existingTimes = new Set(prev.candles.map((c) => c.time));
          const newCandles = older.candles.filter((c) => !existingTimes.has(c.time));
          if (newCandles.length === 0) {
            setHasMore(false);
            return prev;
          }
          const existingOverlayTimes = new Set(prev.overlay.map((o) => o.time));
          const newOverlay = older.overlay.filter((o) => !existingOverlayTimes.has(o.time));
          const existingMarkerKeys = new Set(prev.markers.map((m) => `${m.time}:${m.kind}`));
          const newMarkers = older.markers.filter((m) => !existingMarkerKeys.has(`${m.time}:${m.kind}`));
          const mergedDiagnostics =
            prev.diagnostics && older.diagnostics
              ? {
                  ...prev.diagnostics,
                  factors: older.diagnostics.factors,
                  factor_series: prev.diagnostics.factor_series.map((series) => {
                    const olderSeries = older.diagnostics?.factor_series.find(
                      (candidate) => candidate.factor_id === series.factor_id
                    );
                    if (!olderSeries) {
                      return series;
                    }
                    const existingTimes = new Set(series.points.map((point) => point.time));
                    const newPoints = olderSeries.points.filter(
                      (point) => !existingTimes.has(point.time)
                    );
                    return {
                      ...series,
                      source_mode: olderSeries.source_mode,
                      points: [...newPoints, ...series.points],
                    };
                  }),
                }
              : prev.diagnostics;
          return {
            ...prev,
            candles: [...newCandles, ...prev.candles],
            overlay: [...newOverlay, ...prev.overlay],
            markers: [...newMarkers, ...prev.markers],
            diagnostics: mergedDiagnostics,
          };
        });
      } catch {
        // silently fail — user can retry by scrolling again
      } finally {
        setIsLoadingMore(false);
        setTimeout(() => {
          loadMoreLockRef.current = false;
        }, 1000);
      }
    },
    [source, symbol, timeframe, strategy, hasMore]
  );

  useEffect(() => {
    setHasMore(true);
    loadMoreLockRef.current = false;
  }, [source, symbol, timeframe, strategy]);

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

  useEffect(() => {
    let cancelled = false;
    let refreshTimerId: number | null = null;
    let requestSequence = 0;

    if (strategy !== "jiayi-four-factor" || timeframe === "1d") {
      setDailyFactorReplay(null);
      return;
    }

    async function load() {
      const requestId = ++requestSequence;

      try {
        const replayData = await fetchReplay({
          source,
          symbol,
          timeframe: "1d",
          strategy,
          limit: replayLimitByTimeframe["1d"],
        });

        if (!cancelled && requestId === requestSequence) {
          setDailyFactorReplay(replayData);
        }
      } catch {
        if (!cancelled && requestId === requestSequence) {
          setDailyFactorReplay(null);
        }
      } finally {
        if (!cancelled && requestId === requestSequence) {
          refreshTimerId = window.setTimeout(() => {
            void load();
          }, LIVE_REFRESH_MS);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
      if (refreshTimerId) {
        window.clearTimeout(refreshTimerId);
      }
    };
  }, [source, symbol, strategy, timeframe]);

  useEffect(() => {
    let cancelled = false;
    let refreshTimerId: number | null = null;
    let requestSequence = 0;

    async function load(backgroundRefresh: boolean) {
      const requestId = ++requestSequence;

      if (!backgroundRefresh) {
        setIsLeaderboardLoading(true);
        setLeaderboardError(null);
      }

      try {
        const leaderboardData = await fetchStrategyLeaderboard({
          source,
          symbol,
          timeframe,
          limit: replayLimitByTimeframe[timeframe],
        });

        if (!cancelled && requestId === requestSequence) {
          setLeaderboard(leaderboardData);
          setLeaderboardError(null);
        }
      } catch (loadError) {
        if (!cancelled && requestId === requestSequence) {
          setLeaderboardError(
            loadError instanceof Error ? loadError.message : dictionary.cards.error
          );
        }
      } finally {
        if (!cancelled && requestId === requestSequence && !backgroundRefresh) {
          setIsLeaderboardLoading(false);
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
  }, [dictionary.cards.error, source, symbol, timeframe]);

  const marketCopy = dictionary;
  const lastUpdatedLabel = lastUpdatedAt ? formatTime(lastUpdatedAt, locale) : null;
  const replayWindowSummary = replay
    ? formatReplayWindow({
        candles: replay.candles,
        timeframe,
        timeframeLabel: marketCopy.timeframes[timeframe],
        candlesLabel: marketCopy.stats.candles,
        locale,
      })
    : null;
  const leaderboardWindowSummary = leaderboard
    ? formatDatasetWindow({
        start: leaderboard.start_time,
        end: leaderboard.end_time,
        candleCount: leaderboard.candle_count,
        timeframeLabel: marketCopy.timeframes[timeframe],
        candlesLabel: marketCopy.stats.candles,
        timeframe,
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
  const factorDiagnostics =
    timeframe === "1d"
      ? replay?.diagnostics ?? null
      : dailyFactorReplay?.diagnostics ?? null;

  return (
    <main className="min-h-screen px-5 py-10 text-[#f5eee4] md:px-10 xl:px-14 2xl:px-20">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-14">
        <header className="flex flex-col gap-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl xl:max-w-4xl">
              <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.72rem] uppercase tracking-[0.24em] text-white/40">
                <span
                  className={
                    isZh ? "cjk-copy text-[0.82rem] tracking-[0.12em]" : ""
                  }
                >
                  {marketCopy.nav.researchTerminal}
                </span>
                <span aria-hidden className="h-px w-6 bg-white/15" />
                <span
                  className={
                    isZh ? "cjk-copy text-[0.82rem] tracking-[0.12em]" : ""
                  }
                >
                  {marketCopy.nav.spotOnly}
                </span>
                <span aria-hidden className="h-px w-6 bg-white/15" />
                <span
                  className={
                    isZh ? "cjk-copy text-[0.82rem] tracking-[0.12em]" : ""
                  }
                >
                  {marketCopy.nav.timeframes}
                </span>
              </div>
              <div className="mt-1 max-w-4xl">
                <HeroMarioTitle title={marketCopy.hero.title} />
              </div>
            </div>

            <div className="self-start">
              <LanguageToggle
                label={marketCopy.nav.language}
                locale={locale}
                onChange={setLocale}
              />
            </div>
          </div>

          <div className="grid gap-10 border-t border-white/8 pt-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(640px,1.05fr)] xl:items-start">
            <div>
              <p
                lang={isZh ? "zh-CN" : undefined}
                className={`max-w-[50ch] text-white/60 ${
                  isZh
                    ? "cjk-copy text-[1.02rem] leading-[1.72] tracking-normal"
                    : "text-lg leading-8 tracking-[0.005em]"
                }`}
              >
                {marketCopy.hero.description}
              </p>
            </div>

            <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 xl:grid-cols-4">
              {primaryReplayMetrics.map((card) => (
                <article key={card.label}>
                  <p className="text-[0.68rem] uppercase tracking-[0.26em] text-white/38">
                    {card.label}
                  </p>
                  <p className="mt-3 text-[2.1rem] font-semibold leading-none tracking-[-0.035em] text-[#f8f2e8] md:text-[2.35rem] xl:text-[2rem] 2xl:text-[2.2rem]">
                    {card.value}
                  </p>
                  <div className="mt-4 space-y-1.5">
                    {card.lines.map((line, index) => (
                      <p
                        key={line}
                        className={`leading-[1.45] ${
                          index === 0
                            ? "text-[0.95rem] text-white/64"
                            : "text-[0.85rem] text-white/44"
                        }`}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </article>
              ))}

              {secondaryReplayMetrics.map((card) => (
                <article key={card.label}>
                  <p className="text-[0.68rem] uppercase tracking-[0.26em] text-white/38">
                    {card.label}
                  </p>
                  <p className="mt-3 text-[1.55rem] font-semibold leading-none tracking-[-0.025em] text-[#f8f2e8] md:text-[1.7rem] xl:text-[1.5rem] 2xl:text-[1.65rem]">
                    {card.value}
                  </p>
                  <div className="mt-3 space-y-1">
                    {card.lines.map((line) => (
                      <p key={line} className="text-[0.85rem] leading-[1.45] text-white/50">
                        {line}
                      </p>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>

        </header>

        <section className="sticky top-3 z-40">
          <div className="rounded-2xl border border-white/8 bg-[rgba(13,14,17,0.82)] px-4 py-3.5 backdrop-blur-xl supports-[backdrop-filter]:bg-[rgba(13,14,17,0.7)] md:px-5">
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
              <div className="flex flex-col justify-center rounded-xl px-4 py-2 text-sm text-white/80">
                <span className="mb-1 block text-[0.66rem] uppercase tracking-[0.26em] text-white/40">
                  API
                </span>
                <p className="font-medium tracking-[0.02em] text-white/85">
                  FastAPI orchestration
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_380px]">
          <MarketStageChart
            candles={replay?.candles ?? []}
            overlay={replay?.overlay ?? []}
            overlayLabel={replay?.overlay_label ?? "Overlay"}
            markers={replay?.markers ?? []}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            isLoadingMore={isLoadingMore}
            resetKey={`${source}:${symbol}:${timeframe}:${strategy}`}
            onLoadMore={handleLoadMore}
            symbolLabel={marketCopy.assets[symbol as keyof typeof marketCopy.assets]}
            sourceLabel={marketCopy.sources[source]}
            timeframeLabel={marketCopy.timeframes[timeframe]}
            strategyLabel={
              marketCopy.strategies[strategy as keyof typeof marketCopy.strategies].label
            }
            locale={locale}
            markerText={marketCopy.markers}
            chartText={marketCopy.chart}
            factorCopy={marketCopy.factorPanel}
            diagnostics={factorDiagnostics}
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

          <aside className="grid gap-10">
            <SignalFactorsPanel
              diagnostics={replay?.diagnostics ?? null}
              locale={locale}
              sectionLabel={marketCopy.sections.signalFactors}
              copy={marketCopy.factorPanel}
            />

            <section className="rounded-2xl border border-white/8 bg-[#101114] px-6 py-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-white/38">
                    {marketCopy.sections.sessionBias}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.015em] text-[#f7efe5]">
                    {replay
                      ? marketCopy.bias[replay.stats.strategy_bias]
                      : marketCopy.cards.loading}
                  </h2>
                </div>
                <Radar className="mt-1 h-5 w-5 text-white/55" />
              </div>

              <p className="mt-4 text-[0.95rem] leading-[1.7] text-white/58">
                {replay
                  ? `${marketCopy.strategies[strategy].style} · ${marketCopy.stats.confidencePrefix} ${replay.stats.confidence.toFixed(2)}`
                  : marketCopy.cards.retryHint}
              </p>

              <div className="mt-6 space-y-5 border-t border-white/6 pt-5">
                <div>
                  <p className="text-[0.75rem] uppercase tracking-[0.22em] text-white/42">
                    {marketCopy.cards.confidence}
                  </p>
                  <div className="mt-3 h-[3px] rounded-full bg-white/8">
                    <div
                      className="h-[3px] rounded-full bg-[#d8cdbd]"
                      style={{
                        width: `${Math.max(
                          8,
                          Math.round((replay?.stats.confidence ?? 0) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="mt-3 text-[0.9rem] text-white/60">
                    {replay
                      ? `${marketCopy.stats.confidencePrefix} ${replay.stats.confidence.toFixed(
                          2
                        )}`
                      : marketCopy.cards.loading}
                  </p>
                </div>

                <div className="border-t border-white/6 pt-5">
                  <p className="text-[0.75rem] uppercase tracking-[0.22em] text-white/42">
                    {marketCopy.cards.researchMode}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[#f7efe5]">
                    {marketCopy.cards.localOnly}
                  </p>
                  <p className="mt-1 text-[0.9rem] text-white/55">{marketCopy.cards.noLive}</p>
                </div>

                {error ? (
                  <div className="border-t border-[#a96554]/40 pt-5 text-sm text-[#f4c2b0]">
                    <p className="font-semibold">{marketCopy.cards.error}</p>
                    <p className="mt-1">{error}</p>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/8 bg-[#101114] px-6 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-white/38">
                    {marketCopy.sections.watchStack}
                  </p>
                  <h2 className="mt-3 text-xl font-semibold tracking-[-0.015em] text-[#f7efe5]">
                    {marketCopy.watch.currentFocus}
                  </h2>
                </div>
                <Waves className="h-5 w-5 text-white/55" />
              </div>
              <p className="mt-3 text-[0.9rem] leading-[1.6] text-white/52">
                {marketCopy.watch.currentFocusSubtitle}
              </p>
              <div className="mt-5 divide-y divide-white/6 border-t border-white/6">
                {watchlist.map((asset) => (
                  <div
                    key={asset.symbol}
                    className="flex items-center justify-between py-3.5"
                  >
                    <div>
                      <p className="text-[0.98rem] font-semibold text-[#f8f2e8]">
                        {marketCopy.assets[asset.symbol as keyof typeof marketCopy.assets]}
                      </p>
                      <p className="text-[0.8rem] text-white/48">
                        {marketCopy.sources[asset.source_id]} ·{" "}
                        {marketCopy.bias[asset.strategy_bias]}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[0.98rem] font-semibold tabular-nums text-[#f8f2e8]">
                        {formatUsd(asset.last_close, locale)}
                      </p>
                      <p
                        className={`text-[0.82rem] tabular-nums ${
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

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
          <StrategyLeaderboard
            entries={leaderboard?.entries ?? []}
            isLoading={isLeaderboardLoading}
            error={leaderboardError}
            locale={locale}
            sectionLabel={marketCopy.sections.strategyBoard}
            title={`${marketCopy.assets[symbol as keyof typeof marketCopy.assets]} · ${marketCopy.timeframes[timeframe]}`}
            sourceLabel={marketCopy.sources[source]}
            windowDateRange={leaderboardWindowSummary?.dateRange ?? null}
            windowMeta={leaderboardWindowSummary?.meta ?? null}
            buyHoldReturn={
              leaderboard
                ? formatPercent(leaderboard.buy_hold_return_pct, locale)
                : null
            }
            selectedStrategyId={strategy}
            onSelectStrategy={setStrategy}
            biasLabels={marketCopy.bias}
            copy={marketCopy.leaderboard}
          />

          <section className="rounded-2xl border border-white/8 bg-[#101114] px-6 py-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-white/38">
                  {marketCopy.sections.strategyRack}
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.015em] text-[#f7efe5]">
                  {marketCopy.hero.title}
                </h2>
              </div>
              <Bot className="h-5 w-5 text-white/55" />
            </div>
            <div className="mt-6 divide-y divide-white/6 border-t border-white/6">
              {strategyOptions.map((strategyOption) => {
                const copy = marketCopy.strategies[strategyOption.value];
                return (
                  <article
                    key={strategyOption.value}
                    className="py-5 first:pt-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[1.02rem] font-semibold text-[#f7efe5]">
                          {copy.label}
                        </p>
                        <p className="mt-1 text-[0.85rem] text-white/48">{copy.style}</p>
                      </div>
                      <span className="text-[0.68rem] uppercase tracking-[0.22em] text-white/50">
                        {strategyOption.disabled
                          ? marketCopy.cards.waiting
                          : marketCopy.cards.available}
                      </span>
                    </div>
                    <p className="mt-3 max-w-[36ch] text-[0.9rem] leading-[1.6] text-white/58">
                      {copy.thesis}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        </section>

      </div>
    </main>
  );
}

function formatReplayWindow({
  candles,
  timeframe,
  timeframeLabel,
  candlesLabel,
  locale,
}: {
  candles: ReplayResponse["candles"];
  timeframe: Timeframe;
  timeframeLabel: string;
  candlesLabel: string;
  locale: "en" | "zh";
}) {
  if (candles.length === 0) {
    return null;
  }

  return formatDatasetWindow({
    start: candles[0].time,
    end: candles[candles.length - 1].time,
    candleCount: candles.length,
    timeframeLabel,
    candlesLabel,
    timeframe,
    locale,
  });
}
