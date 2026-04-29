"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Activity, Cpu, Zap } from "lucide-react";

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
import { CryptoLogoLottie } from "@/features/dashboard/components/crypto-logo-lottie";
import { HeroMarioTitle } from "@/features/dashboard/components/hero-mario-title";
import { HudFrame } from "@/features/dashboard/components/hud-frame";
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
import { dashboardTheme } from "@/features/dashboard/themes";
import { getThemeStyle } from "@/features/dashboard/themes/types";
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
  const theme = dashboardTheme;
  const pageStyle = {
    ...getThemeStyle(theme),
    background: "var(--theme-page-bg)",
    color: "var(--theme-copy-strong)",
  };
  const panelStyle = {
    borderColor: "var(--theme-panel-border)",
    background: "var(--theme-panel)",
    boxShadow: "var(--theme-shadow)",
  };
  const stickyPanelStyle = {
    borderColor: "var(--theme-panel-border-strong)",
    background: "color-mix(in srgb, var(--theme-panel) 88%, transparent)",
    boxShadow: "var(--theme-shadow-strong)",
  };
  const kickerStyle = { color: "var(--theme-copy-faint)" };
  const titleStyle = { color: "var(--theme-title)" };
  const bodyStyle = { color: "var(--theme-copy)" };
  const mutedStyle = { color: "var(--theme-copy-soft)" };

  return (
    <main
      className="relative min-h-screen px-5 py-8 md:px-10 md:py-9 xl:px-14 2xl:px-20"
      style={{ ...pageStyle, overflowX: "clip" }}
      data-theme={theme.id}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: "var(--theme-page-radial)",
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      />
      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-8 xl:gap-10">
        <SystemStatusBar
          isRefreshing={isRefreshing}
          lastUpdatedLabel={lastUpdatedLabel}
          symbol={symbol}
          source={source}
          timeframe={timeframe}
        />

        <header className="flex flex-col gap-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex max-w-5xl flex-col gap-3 md:flex-row md:items-center md:gap-5 xl:max-w-[72rem]">
              <div className="max-w-3xl xl:max-w-4xl">
                <div
                  className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono-data text-[0.72rem] uppercase tracking-[0.18em]"
                  style={{ color: "var(--theme-hero-kicker)" }}
                >
                  <span className="neon-text-magenta">[</span>
                  <span
                    className={
                      isZh ? "cjk-copy text-[0.82rem] tracking-[0.12em]" : ""
                    }
                  >
                    {marketCopy.nav.researchTerminal}
                  </span>
                  <span className="neon-text-magenta">]</span>
                  <span
                    aria-hidden
                    className="h-px w-4"
                    style={{ background: "var(--theme-accent)" }}
                  />
                  <span
                    className={`neon-text-cyan ${
                      isZh ? "cjk-copy text-[0.82rem] tracking-[0.12em]" : ""
                    }`.trim()}
                  >
                    {marketCopy.nav.spotOnly}
                  </span>
                  <span
                    aria-hidden
                    className="h-px w-4"
                    style={{ background: "var(--theme-accent-2)" }}
                  />
                  <span
                    className={
                      isZh ? "cjk-copy text-[0.82rem] tracking-[0.12em]" : ""
                    }
                  >
                    {marketCopy.nav.timeframes}
                  </span>
                </div>
                <HudFrame
                  className="mt-1 max-w-4xl px-4 py-4 md:px-6 md:py-4 cyber-clip scan-strip"
                  style={{
                    border: "1px solid var(--theme-panel-border-strong)",
                    backgroundImage: "var(--theme-hero-glow)",
                    boxShadow: "var(--theme-shadow-strong)",
                  }}
                >
                  <HeroMarioTitle title={marketCopy.hero.title} theme={theme} />
                </HudFrame>
              </div>
              <div className="md:pt-8 xl:pt-10">
                <CryptoLogoLottie locale={locale} theme={theme} compact />
              </div>
            </div>

            <div className="self-start">
              <LanguageToggle
                label={marketCopy.nav.language}
                locale={locale}
                onChange={setLocale}
                theme={theme}
              />
            </div>
          </div>

          <div className="border-t pt-5" style={{ borderColor: "var(--theme-panel-border)" }}>
            <HudFrame
              className="grid gap-4 cyber-clip border p-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(760px,1.05fr)] lg:items-start"
              style={panelStyle}
            >
              <div>
                <p
                  className="font-mono-data text-[0.68rem] uppercase tracking-[0.22em] neon-text-magenta"
                >
                  {theme.kicker}
                </p>
                <p
                  lang={isZh ? "zh-CN" : undefined}
                  className={`mt-3 max-w-[52ch] ${
                    isZh
                      ? "cjk-copy text-[0.98rem] leading-[1.68] tracking-normal"
                      : "text-[1rem] leading-7 tracking-[0.005em]"
                  }`}
                  style={bodyStyle}
                >
                  {marketCopy.hero.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 font-mono-data text-[0.7rem] uppercase tracking-[0.16em]">
                  <CyberTag tone="active">{marketCopy.cards.localOnly}</CyberTag>
                  <CyberTag>{marketCopy.stats.autoRefresh}</CyberTag>
                  <CyberTag>BTC · ETH · SOL · DOGE</CyberTag>
                </div>
              </div>

              <div className="grid w-full gap-2 lg:translate-x-4 lg:grid-cols-4 lg:self-stretch">
                {replayMetrics.map((card, idx) => (
                  <article
                    key={card.label}
                    className="cyber-clip px-3 py-3"
                    style={{
                      background:
                        card.tone === "primary"
                          ? "color-mix(in srgb, var(--theme-panel-strong) 76%, transparent)"
                          : "color-mix(in srgb, var(--theme-panel) 88%, transparent)",
                      borderLeft: `2px solid ${
                        idx % 2 === 0
                          ? "var(--theme-accent)"
                          : "var(--theme-accent-2)"
                      }`,
                    }}
                  >
                    <p
                      className="font-mono-data text-[0.62rem] uppercase tracking-[0.22em]"
                      style={{
                        color:
                          idx % 2 === 0
                            ? "var(--theme-accent)"
                            : "var(--theme-accent-2)",
                      }}
                    >
                      {`> ${card.label}`}
                    </p>
                    <p
                      className={`mt-2 font-mono-data font-semibold leading-none ${
                        card.tone === "primary"
                          ? "text-[1.55rem] tracking-[-0.02em]"
                          : "text-[1.25rem] tracking-[-0.01em]"
                      } ${
                        card.tone === "primary"
                          ? idx % 2 === 0
                            ? "neon-text-magenta"
                            : "neon-text-cyan"
                          : ""
                      }`.trim()}
                      style={card.tone === "primary" ? undefined : titleStyle}
                    >
                      {card.value}
                    </p>
                    <div className="mt-3 space-y-1">
                      {card.lines.map((line, index) => (
                        <p
                          key={line}
                          className={index === 0 ? "text-[0.85rem]" : "text-[0.76rem]"}
                          style={index === 0 ? bodyStyle : mutedStyle}
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </HudFrame>
          </div>

        </header>

        <section className="sticky top-4 z-50">
          <HudFrame
            accent="cyan"
            className="cyber-clip border px-4 py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-[rgba(8,2,18,0.7)] md:px-5"
            style={stickyPanelStyle}
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <ControlSelect
                label={marketCopy.controls.source}
                value={source}
                options={translatedSourceOptions}
                onChange={(value) => setSource(value as SourceId)}
                theme={theme}
              />
              <ControlSelect
                label={marketCopy.controls.pair}
                value={symbol}
                options={translatedSymbolOptions}
                onChange={setSymbol}
                theme={theme}
              />
              <ControlSelect
                label={marketCopy.controls.timeframe}
                value={timeframe}
                options={translatedTimeframeOptions}
                onChange={(value) => setTimeframe(value as Timeframe)}
                theme={theme}
              />
              <ControlSelect
                label={marketCopy.controls.strategy}
                value={strategy}
                options={translatedStrategyOptions}
                onChange={(value) => setStrategy(value as StrategyId)}
                theme={theme}
              />
              <div
                className="flex flex-col justify-center cyber-clip border px-4 py-2 text-sm"
                style={{
                  borderColor: "var(--theme-control-border)",
                  background: "var(--theme-control)",
                  color: "var(--theme-copy-strong)",
                  boxShadow: "var(--theme-shadow)",
                }}
              >
                <span
                  className="mb-1 block font-mono-data text-[0.62rem] uppercase tracking-[0.24em] neon-text-cyan"
                >
                  &gt; UPLINK
                </span>
                <p
                  className="font-mono-data font-medium tracking-[0.02em] term-cursor"
                  style={titleStyle}
                >
                  FastAPI · ONLINE
                </p>
              </div>
            </div>
          </HudFrame>
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
            theme={theme}
          />

          <aside className="grid gap-10">
            <SignalFactorsPanel
              diagnostics={replay?.diagnostics ?? null}
              locale={locale}
              sectionLabel={marketCopy.sections.signalFactors}
              copy={marketCopy.factorPanel}
              theme={theme}
            />

            <HudFrame className="cyber-clip border px-6 py-6" style={panelStyle}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className="font-mono-data text-[0.66rem] uppercase tracking-[0.26em] neon-text-magenta"
                  >
                    {`// ${marketCopy.sections.sessionBias}`}
                  </p>
                  <h2
                    className="mt-3 text-2xl font-semibold tracking-[-0.015em] neon-text"
                    style={titleStyle}
                  >
                    {replay
                      ? marketCopy.bias[replay.stats.strategy_bias]
                      : marketCopy.cards.loading}
                  </h2>
                </div>
                <Activity
                  className="mt-1 h-5 w-5"
                  style={{
                    color: "var(--theme-accent)",
                    filter: "drop-shadow(0 0 8px rgba(255,43,214,0.7))",
                  }}
                />
              </div>

              <p className="mt-4 text-[0.95rem] leading-[1.7]" style={bodyStyle}>
                {replay
                  ? `${marketCopy.strategies[strategy].style} · ${marketCopy.stats.confidencePrefix} ${replay.stats.confidence.toFixed(2)}`
                  : marketCopy.cards.retryHint}
              </p>

              <div className="mt-6 space-y-5 border-t pt-5" style={{ borderColor: "var(--theme-panel-border)" }}>
                <div>
                  <p className="text-[0.75rem] uppercase tracking-[0.22em]" style={kickerStyle}>
                    {marketCopy.cards.confidence}
                  </p>
                  <div className="mt-3 h-[3px] rounded-full" style={{ background: "var(--theme-track)" }}>
                    <div
                      className="h-[3px] rounded-full"
                      style={{
                        background: "var(--theme-progress)",
                        width: `${Math.max(
                          8,
                          Math.round((replay?.stats.confidence ?? 0) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="mt-3 text-[0.9rem]" style={bodyStyle}>
                    {replay
                      ? `${marketCopy.stats.confidencePrefix} ${replay.stats.confidence.toFixed(
                          2
                        )}`
                      : marketCopy.cards.loading}
                  </p>
                </div>

                <div className="border-t pt-5" style={{ borderColor: "var(--theme-panel-border)" }}>
                  <p className="text-[0.75rem] uppercase tracking-[0.22em]" style={kickerStyle}>
                    {marketCopy.cards.researchMode}
                  </p>
                  <p className="mt-2 text-lg font-semibold" style={titleStyle}>
                    {marketCopy.cards.localOnly}
                  </p>
                  <p className="mt-1 text-[0.9rem]" style={mutedStyle}>{marketCopy.cards.noLive}</p>
                </div>

                {error ? (
                  <div
                    className="border-t pt-5 text-sm"
                    style={{
                      borderColor:
                        "color-mix(in srgb, var(--theme-negative) 40%, transparent)",
                      color: "var(--theme-copy-strong)",
                    }}
                  >
                    <p className="font-mono-data font-semibold neon-text-magenta">
                      {`!! ${marketCopy.cards.error}`}
                    </p>
                    <p className="mt-1">{error}</p>
                  </div>
                ) : null}
              </div>
            </HudFrame>

            <HudFrame
              accent="cyan"
              className="cyber-clip border px-6 py-6"
              style={panelStyle}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="font-mono-data text-[0.66rem] uppercase tracking-[0.26em] neon-text-cyan"
                  >
                    {`// ${marketCopy.sections.watchStack}`}
                  </p>
                  <h2
                    className="mt-3 text-xl font-semibold tracking-[-0.015em]"
                    style={titleStyle}
                  >
                    {marketCopy.watch.currentFocus}
                  </h2>
                </div>
                <Zap
                  className="h-5 w-5"
                  style={{
                    color: "var(--theme-accent-2)",
                    filter: "drop-shadow(0 0 8px rgba(0,240,255,0.7))",
                  }}
                />
              </div>
              <p className="mt-3 text-[0.9rem] leading-[1.6]" style={bodyStyle}>
                {marketCopy.watch.currentFocusSubtitle}
              </p>
              <div className="mt-5 divide-y border-t" style={{ borderColor: "var(--theme-panel-border)" }}>
                {watchlist.map((asset) => (
                  <div
                    key={asset.symbol}
                    className="flex items-center justify-between py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="inline-block h-6 w-[3px]"
                        style={{
                          background:
                            asset.change_pct >= 0
                              ? "var(--theme-positive)"
                              : "var(--theme-negative)",
                          boxShadow:
                            asset.change_pct >= 0
                              ? "0 0 10px rgba(57,255,20,0.7)"
                              : "0 0 10px rgba(255,59,107,0.7)",
                        }}
                      />
                      <div>
                        <p className="text-[0.98rem] font-semibold" style={titleStyle}>
                          {marketCopy.assets[asset.symbol as keyof typeof marketCopy.assets]}
                        </p>
                        <p
                          className="font-mono-data text-[0.78rem] uppercase tracking-[0.14em]"
                          style={mutedStyle}
                        >
                          {marketCopy.sources[asset.source_id]} ·{" "}
                          {marketCopy.bias[asset.strategy_bias]}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className="font-mono-data text-[0.98rem] font-semibold tabular-nums"
                        style={titleStyle}
                      >
                        {formatUsd(asset.last_close, locale)}
                      </p>
                      <p
                        className="font-mono-data text-[0.82rem] tabular-nums"
                        style={{
                          color:
                            asset.change_pct >= 0
                              ? "var(--theme-positive)"
                              : "var(--theme-negative)",
                          textShadow:
                            asset.change_pct >= 0
                              ? "0 0 8px rgba(57,255,20,0.45)"
                              : "0 0 8px rgba(255,59,107,0.45)",
                        }}
                      >
                        {formatPercent(asset.change_pct, locale)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </HudFrame>
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
            theme={theme}
            copy={marketCopy.leaderboard}
          />

          <HudFrame className="cyber-clip border px-6 py-6" style={panelStyle}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p
                  className="font-mono-data text-[0.66rem] uppercase tracking-[0.26em] neon-text-magenta"
                >
                  {`// ${marketCopy.sections.strategyRack}`}
                </p>
                <h2
                  className="mt-3 text-2xl font-semibold tracking-[-0.015em]"
                  style={titleStyle}
                >
                  {marketCopy.hero.title}
                </h2>
              </div>
              <Cpu
                className="h-5 w-5"
                style={{
                  color: "var(--theme-accent-3)",
                  filter: "drop-shadow(0 0 8px rgba(57,255,20,0.7))",
                }}
              />
            </div>
            <div className="mt-6 divide-y border-t" style={{ borderColor: "var(--theme-panel-border)" }}>
              {strategyOptions.map((strategyOption) => {
                const copy = marketCopy.strategies[strategyOption.value];
                return (
                  <article
                    key={strategyOption.value}
                    className="py-5 first:pt-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[1.02rem] font-semibold" style={titleStyle}>
                          {copy.label}
                        </p>
                        <p
                          className="mt-1 font-mono-data text-[0.82rem] uppercase tracking-[0.14em]"
                          style={mutedStyle}
                        >
                          {copy.style}
                        </p>
                      </div>
                      <span
                        className="font-mono-data text-[0.66rem] uppercase tracking-[0.2em]"
                        style={{
                          color: strategyOption.disabled
                            ? "var(--theme-copy-faint)"
                            : "var(--theme-accent-3)",
                          textShadow: strategyOption.disabled
                            ? "none"
                            : "0 0 8px rgba(57,255,20,0.5)",
                        }}
                      >
                        {strategyOption.disabled
                          ? `[${marketCopy.cards.waiting}]`
                          : `[${marketCopy.cards.available}]`}
                      </span>
                    </div>
                    <p className="mt-3 max-w-[36ch] text-[0.9rem] leading-[1.6]" style={bodyStyle}>
                      {copy.thesis}
                    </p>
                  </article>
                );
              })}
            </div>
          </HudFrame>
        </section>

      </div>
    </main>
  );
}

function CyberTag({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "active";
}) {
  if (tone === "active") {
    return (
      <span
        className="cyber-clip border px-3 py-1.5 neon-text-magenta"
        style={{
          borderColor: "var(--theme-chip-active-border)",
          background: "var(--theme-chip-active)",
        }}
      >
        {`[ ${children} ]`}
      </span>
    );
  }
  return (
    <span
      className="cyber-clip border px-3 py-1.5"
      style={{
        borderColor: "var(--theme-chip-border)",
        background: "var(--theme-chip)",
        color: "var(--theme-copy)",
      }}
    >
      {`[ ${children} ]`}
    </span>
  );
}

function SystemStatusBar({
  isRefreshing,
  lastUpdatedLabel,
  symbol,
  source,
  timeframe,
}: {
  isRefreshing: boolean;
  lastUpdatedLabel: string | null;
  symbol: string;
  source: SourceId;
  timeframe: Timeframe;
}) {
  const segments = [
    `SYS:NEON-GRID v0.4`,
    `UPLINK:${source.toUpperCase()}`,
    `PAIR:${symbol}`,
    `TF:${timeframe.toUpperCase()}`,
    isRefreshing ? `STATE:SYNCING…` : `STATE:LOCKED`,
    lastUpdatedLabel ? `LAST:${lastUpdatedLabel}` : `LAST:--:--:--`,
    `MEM:OK`,
    `CPU:1.42GHz`,
    `LATENCY:14ms`,
    `POSITION:READ-ONLY`,
  ];
  const repeated = [...segments, ...segments, ...segments];

  return (
    <div
      className="relative overflow-hidden border-y font-mono-data text-[0.7rem] uppercase tracking-[0.2em]"
      style={{
        borderColor: "var(--theme-panel-border)",
        background:
          "linear-gradient(90deg, rgba(8,2,18,0.92) 0%, rgba(20,6,36,0.78) 50%, rgba(8,2,18,0.92) 100%)",
        color: "var(--theme-copy-soft)",
      }}
    >
      <div className="flex items-center gap-3 px-4 py-1.5">
        <span
          className="inline-flex items-center gap-1.5 neon-text-acid"
          aria-hidden
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{
              background: "var(--theme-accent-3)",
              boxShadow: "0 0 8px rgba(57,255,20,0.9)",
            }}
          />
          ONLINE
        </span>
        <span style={{ color: "var(--theme-panel-border-strong)" }}>│</span>
        <div className="flex-1 overflow-hidden">
          <div className="ticker-track">
            {repeated.map((seg, idx) => (
              <span key={`${seg}-${idx}`} className="px-6">
                {seg}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
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
