"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  createChart,
  createSeriesMarkers,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  LineSeries,
  LineStyle,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";

import { buildMacdSeries } from "@/features/dashboard/chart-indicators";
import { FactorSubcharts } from "@/features/dashboard/components/factor-subcharts";
import type { DashboardTheme } from "@/features/dashboard/themes/types";
import type {
  Candle,
  OverlayPoint,
  ReplayResponse,
  SignalMarker,
} from "@/features/dashboard/types";
import type { Locale } from "@/features/i18n/dictionaries";

type MarketStageChartProps = {
  candles: Candle[];
  overlay: OverlayPoint[];
  overlayLabel: string;
  markers: SignalMarker[];
  symbolLabel: string;
  sourceLabel: string;
  timeframeLabel: string;
  strategyLabel: string;
  locale: Locale;
  markerText: {
    entry: string;
    exit: string;
  };
  chartText: {
    macdPane: string;
    macdLine: string;
    signalLine: string;
    histogram: string;
    zeroLine: string;
    factorSubcharts: string;
    factorFixedDaily: string;
  };
  factorCopy: {
    long: string;
    defensive: string;
    neutral: string;
    live: string;
    proxy: string;
    unavailable: string;
    factorNames: Record<
      "fear_greed" | "mvrv_z" | "sopr" | "etf_flow_5d_usd" | "macro_regime",
      string
    >;
    sources: Record<
      "fear_greed" | "mvrv_z" | "sopr" | "etf_flow_5d_usd" | "macro_regime",
      Record<"live" | "proxy" | "unavailable", string>
    >;
    macroLabels: {
      bullish: string;
      neutral: string;
      defensive: string;
    };
    fearLabels: {
      bullish: string;
      neutral: string;
      defensive: string;
    };
  };
  diagnostics: ReplayResponse["diagnostics"];
  loadingLabel: string;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  resetKey: string;
  liveBadgeLabel: string;
  refreshBadgeLabel: string;
  lastUpdatedLabel: string | null;
  interactionHint: string;
  onLoadMore?: (endTime: string) => void;
  theme: DashboardTheme;
};

export function MarketStageChart({
  candles,
  overlay,
  overlayLabel,
  markers,
  symbolLabel,
  sourceLabel,
  timeframeLabel,
  strategyLabel,
  locale,
  markerText,
  chartText,
  factorCopy,
  diagnostics,
  loadingLabel,
  isLoading,
  isRefreshing,
  isLoadingMore,
  resetKey,
  liveBadgeLabel,
  refreshBadgeLabel,
  lastUpdatedLabel,
  interactionHint,
  onLoadMore,
  theme,
}: MarketStageChartProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlesticksRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const regimeRef = useRef<ISeriesApi<"Line"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const macdLineRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdSignalRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdHistogramRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const macdZeroRef = useRef<ISeriesApi<"Line"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const latestPricePulseRef = useRef<HTMLDivElement | null>(null);
  const latestCandleRef = useRef<Candle | null>(null);
  const shouldFitContentRef = useRef(true);
  const onLoadMoreRef = useRef(onLoadMore);
  const candlesRef = useRef(candles);
  const isLoadingMoreRef = useRef(isLoadingMore);
  const prevLogicalFromRef = useRef<number | null>(null);
  const macdSeries = buildMacdSeries(candles, {
    positiveHistogram: theme.chart.histogramPositive,
    negativeHistogram: theme.chart.histogramNegative,
  });

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    candlesRef.current = candles;
  }, [candles]);

  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);

  useEffect(() => {
    latestCandleRef.current = candles.at(-1) ?? null;
  }, [candles]);

  useEffect(() => {
    if (!containerRef.current || chartRef.current) {
      return;
    }

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: theme.chart.background },
        textColor: theme.chart.textColor,
        attributionLogo: false,
        panes: {
          enableResize: true,
          separatorColor: theme.chart.paneSeparator,
          separatorHoverColor: theme.chart.paneSeparatorHover,
        },
      },
      grid: {
        vertLines: { color: theme.chart.gridVertical },
        horzLines: { color: theme.chart.gridHorizontal },
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: {
          color: theme.chart.crosshairCool,
          width: 1,
          labelBackgroundColor: theme.chart.crosshairCoolLabel,
        },
        horzLine: {
          color: theme.chart.crosshairWarm,
          labelBackgroundColor: theme.chart.crosshairWarmLabel,
        },
      },
      rightPriceScale: {
        borderColor: theme.chart.border,
      },
      timeScale: {
        borderColor: theme.chart.border,
        timeVisible: true,
        rightOffset: 8,
      },
      handleScroll: {
        mouseWheel: false,
        pressedMouseMove: true,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
      },
    });

    const candlesticks = chart.addSeries(
      CandlestickSeries,
      {
        upColor: theme.chart.candleUp,
        downColor: theme.chart.candleDown,
        wickUpColor: theme.chart.candleUp,
        wickDownColor: theme.chart.candleDown,
        borderVisible: false,
        priceLineColor: theme.chart.priceLine,
        lastValueVisible: true,
      },
      0
    );

    const regime = chart.addSeries(
      LineSeries,
      {
        color: theme.chart.overlay,
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
      },
      0
    );

    const volume = chart.addSeries(
      HistogramSeries,
      {
        priceFormat: { type: "volume" },
        priceScaleId: "",
        lastValueVisible: false,
        priceLineVisible: false,
      },
      0
    );

    const macdHistogram = chart.addSeries(
      HistogramSeries,
      {
        priceFormat: { type: "price", precision: 4, minMove: 0.0001 },
        base: 0,
        priceLineVisible: false,
        lastValueVisible: false,
      },
      1
    );
    const macdLine = chart.addSeries(
      LineSeries,
      {
        color: theme.chart.macdLine,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      },
      1
    );
    const macdSignal = chart.addSeries(
      LineSeries,
      {
        color: theme.chart.macdSignal,
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
      },
      1
    );
    const macdZero = chart.addSeries(
      LineSeries,
      {
        color: theme.chart.macdZero,
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        priceLineVisible: false,
        lastValueVisible: false,
      },
      1
    );

    volume.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    macdHistogram.priceScale().applyOptions({
      scaleMargins: {
        top: 0.16,
        bottom: 0.16,
      },
    });

    const panes = chart.panes();
    panes[0]?.setStretchFactor(0.74);
    panes[1]?.setStretchFactor(0.26);

    const repositionLatestPricePulse = () => {
      if (
        !wrapperRef.current ||
        !latestPricePulseRef.current ||
        !candlesticksRef.current ||
        !chartRef.current
      ) {
        return;
      }

      const paneElement = chartRef.current.panes()[0]?.getHTMLElement();
      const latestCandle = latestCandleRef.current;
      if (!paneElement || !latestCandle) {
        latestPricePulseRef.current.style.opacity = "0";
        return;
      }

      const timeCoordinate = chartRef.current
        .timeScale()
        .timeToCoordinate(toChartTime(latestCandle.time));
      const priceCoordinate = candlesticksRef.current.priceToCoordinate(
        latestCandle.close
      );
      if (timeCoordinate === null || priceCoordinate === null) {
        latestPricePulseRef.current.style.opacity = "0";
        return;
      }

      const wrapperRect = wrapperRef.current.getBoundingClientRect();
      const paneRect = paneElement.getBoundingClientRect();
      latestPricePulseRef.current.style.opacity = "1";
      latestPricePulseRef.current.style.left = `${
        paneRect.left - wrapperRect.left + timeCoordinate
      }px`;
      latestPricePulseRef.current.style.top = `${
        paneRect.top - wrapperRect.top + priceCoordinate
      }px`;
    };

    const handleViewportChange = () => {
      window.requestAnimationFrame(repositionLatestPricePulse);

      if (!chartRef.current || isLoadingMoreRef.current || !onLoadMoreRef.current) return;
      if (shouldFitContentRef.current) return;
      const range = chartRef.current.timeScale().getVisibleLogicalRange();
      if (!range || candlesRef.current.length === 0) return;
      const prevFrom = prevLogicalFromRef.current;
      prevLogicalFromRef.current = range.from;
      if (prevFrom === null) return;
      const isScrollingLeft = range.from < prevFrom;
      if (isScrollingLeft && range.from < 20) {
        onLoadMoreRef.current(candlesRef.current[0].time);
      }
    };

    chartRef.current = chart;
    candlesticksRef.current = candlesticks;
    regimeRef.current = regime;
    volumeRef.current = volume;
    macdLineRef.current = macdLine;
    macdSignalRef.current = macdSignal;
    macdHistogramRef.current = macdHistogram;
    macdZeroRef.current = macdZero;
    markersRef.current = createSeriesMarkers(candlesticks, []);
    chart.timeScale().subscribeVisibleLogicalRangeChange(handleViewportChange);
    chart.timeScale().subscribeSizeChange(handleViewportChange);

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleViewportChange);
      chart.timeScale().unsubscribeSizeChange(handleViewportChange);
      markersRef.current?.detach();
      markersRef.current = null;
      candlesticksRef.current = null;
      regimeRef.current = null;
      volumeRef.current = null;
      macdLineRef.current = null;
      macdSignalRef.current = null;
      macdHistogramRef.current = null;
      macdZeroRef.current = null;
      chart.remove();
      chartRef.current = null;
    };
  }, [theme]);

  useEffect(() => {
    if (
      !chartRef.current ||
      !candlesticksRef.current ||
      !regimeRef.current ||
      !volumeRef.current ||
      !macdLineRef.current ||
      !macdSignalRef.current ||
      !macdHistogramRef.current ||
      !macdZeroRef.current
    ) {
      return;
    }

    chartRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: theme.chart.background },
        textColor: theme.chart.textColor,
        attributionLogo: false,
        panes: {
          enableResize: true,
          separatorColor: theme.chart.paneSeparator,
          separatorHoverColor: theme.chart.paneSeparatorHover,
        },
      },
      grid: {
        vertLines: { color: theme.chart.gridVertical },
        horzLines: { color: theme.chart.gridHorizontal },
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: {
          color: theme.chart.crosshairCool,
          width: 1,
          labelBackgroundColor: theme.chart.crosshairCoolLabel,
        },
        horzLine: {
          color: theme.chart.crosshairWarm,
          labelBackgroundColor: theme.chart.crosshairWarmLabel,
        },
      },
      rightPriceScale: {
        borderColor: theme.chart.border,
      },
      timeScale: {
        borderColor: theme.chart.border,
        timeVisible: true,
        rightOffset: 8,
      },
    });

    candlesticksRef.current.applyOptions({
      upColor: theme.chart.candleUp,
      downColor: theme.chart.candleDown,
      wickUpColor: theme.chart.candleUp,
      wickDownColor: theme.chart.candleDown,
      borderVisible: false,
      priceLineColor: theme.chart.priceLine,
      lastValueVisible: true,
    });
    regimeRef.current.applyOptions({
      color: theme.chart.overlay,
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    volumeRef.current.applyOptions({
      priceFormat: { type: "volume" },
      priceScaleId: "",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    macdLineRef.current.applyOptions({
      color: theme.chart.macdLine,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    macdSignalRef.current.applyOptions({
      color: theme.chart.macdSignal,
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    macdHistogramRef.current.applyOptions({
      priceFormat: { type: "price", precision: 4, minMove: 0.0001 },
      base: 0,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    macdZeroRef.current.applyOptions({
      color: theme.chart.macdZero,
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      priceLineVisible: false,
      lastValueVisible: false,
    });
  }, [theme]);

  useEffect(() => {
    shouldFitContentRef.current = true;
    prevLogicalFromRef.current = null;
  }, [resetKey]);

  useEffect(() => {
    if (
      !candlesticksRef.current ||
      !regimeRef.current ||
      !volumeRef.current ||
      !macdLineRef.current ||
      !macdSignalRef.current ||
      !macdHistogramRef.current ||
      !macdZeroRef.current
    ) {
      return;
    }

    candlesticksRef.current.setData(
      candles.map((candle) => ({
        time: toChartTime(candle.time),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }))
    );
    regimeRef.current.setData(
      overlay.map((point) => ({
        time: toChartTime(point.time),
        value: point.value,
      }))
    );
    volumeRef.current.setData(
      candles.map((candle, index) => ({
        time: toChartTime(candle.time),
        value: candle.volume,
        color:
          index > 0 && candle.close >= candles[index - 1].close
            ? theme.chart.volumeUp
            : theme.chart.volumeDown,
      }))
    );
    macdLineRef.current.setData(
      macdSeries.macdLine.map((point) => ({
        time: toChartTime(point.time),
        value: point.value,
      }))
    );
    macdSignalRef.current.setData(
      macdSeries.signalLine.map((point) => ({
        time: toChartTime(point.time),
        value: point.value,
      }))
    );
    macdHistogramRef.current.setData(
      macdSeries.histogram.map((point) => ({
        time: toChartTime(point.time),
        value: point.value,
        color: point.color,
      }))
    );
    macdZeroRef.current.setData(
      macdSeries.zeroLine.map((point) => ({
        time: toChartTime(point.time),
        value: point.value,
      }))
    );
    markersRef.current?.setMarkers(
      markers.map((marker) => ({
        time: toChartTime(marker.time),
        position: marker.kind === "entry" ? "belowBar" : "aboveBar",
        color:
          marker.kind === "entry"
            ? theme.chart.markerEntry
            : theme.chart.markerExit,
        shape: marker.kind === "entry" ? "arrowUp" : "arrowDown",
        text: marker.kind === "entry" ? markerText.entry : markerText.exit,
      }))
    );

    if (candles.length > 0 && shouldFitContentRef.current) {
      chartRef.current?.timeScale().fitContent();
      shouldFitContentRef.current = false;
    }

    if (
      latestPricePulseRef.current &&
      chartRef.current &&
      candlesticksRef.current &&
      wrapperRef.current
    ) {
      const paneElement = chartRef.current.panes()[0]?.getHTMLElement();
      const latestCandle = candles.at(-1);
      if (!paneElement || !latestCandle) {
        latestPricePulseRef.current.style.opacity = "0";
      } else {
        const timeCoordinate = chartRef.current
          .timeScale()
          .timeToCoordinate(toChartTime(latestCandle.time));
        const priceCoordinate = candlesticksRef.current.priceToCoordinate(
          latestCandle.close
        );
        if (timeCoordinate === null || priceCoordinate === null) {
          latestPricePulseRef.current.style.opacity = "0";
        } else {
          const wrapperRect = wrapperRef.current.getBoundingClientRect();
          const paneRect = paneElement.getBoundingClientRect();
          latestPricePulseRef.current.style.opacity = "1";
          latestPricePulseRef.current.style.left = `${
            paneRect.left - wrapperRect.left + timeCoordinate
          }px`;
          latestPricePulseRef.current.style.top = `${
            paneRect.top - wrapperRect.top + priceCoordinate
          }px`;
        }
      }
    }
  }, [
    candles,
    macdSeries.histogram,
    macdSeries.macdLine,
    macdSeries.signalLine,
    macdSeries.zeroLine,
    markerText.entry,
    markerText.exit,
    markers,
    overlay,
    theme,
  ]);

  return (
    <div
      ref={wrapperRef}
      className="relative overflow-hidden rounded-[2rem] border p-4"
      style={{
        borderColor: "var(--theme-panel-border)",
        background: "var(--theme-panel)",
        boxShadow: "var(--theme-shadow-strong)",
      }}
      data-theme={theme.id}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p
            className="text-[0.72rem] uppercase tracking-[0.24em]"
            style={{ color: "var(--theme-copy-faint)" }}
          >
            {locale === "zh" ? "市场回放" : "Market Replay"}
          </p>
          <h2
            className="mt-2 text-xl font-semibold tracking-[0.02em]"
            style={{ color: "var(--theme-title)" }}
          >
            {sourceLabel} · {symbolLabel} · {strategyLabel}
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--theme-copy-soft)" }}>
            {chartText.macdPane} · {overlayLabel}
          </p>
        </div>
        <div
          className="flex flex-wrap justify-end gap-2 text-xs"
          style={{ color: "var(--theme-copy)" }}
        >
          <span
            className="rounded-full border px-3 py-1.5"
            style={{
              borderColor: "var(--theme-chip-active-border)",
              background: "var(--theme-chip-active)",
              color: "var(--theme-copy-strong)",
            }}
          >
            {isRefreshing ? refreshBadgeLabel : liveBadgeLabel}
          </span>
          {lastUpdatedLabel ? (
            <span
              className="rounded-full border px-3 py-1.5"
              style={{
                borderColor: "var(--theme-chip-border)",
                background: "var(--theme-chip)",
              }}
            >
              {lastUpdatedLabel}
            </span>
          ) : null}
          <span
            className="rounded-full border px-3 py-1.5"
            style={{
              borderColor: "var(--theme-chip-border)",
              background: "var(--theme-chip)",
            }}
          >
            {timeframeLabel}
          </span>
          <span
            className="rounded-full border px-3 py-1.5"
            style={{
              borderColor: "var(--theme-chip-border)",
              background: "var(--theme-chip)",
            }}
          >
            {candles.length} {locale === "zh" ? "根K线" : "candles"}
          </span>
          <span
            className="rounded-full border px-3 py-1.5"
            style={{
              borderColor: "var(--theme-chip-border)",
              background: "var(--theme-chip)",
            }}
          >
            {overlayLabel}
          </span>
        </div>
      </div>

      <div
        className="mb-3 grid gap-2 text-xs md:grid-cols-4"
        style={{ color: "var(--theme-copy)" }}
      >
        <IndicatorPill
          label={chartText.macdLine}
          value={formatIndicatorValue(macdSeries.latest.macd)}
          tone="cool"
          theme={theme}
        />
        <IndicatorPill
          label={chartText.signalLine}
          value={formatIndicatorValue(macdSeries.latest.signal)}
          tone="warm"
          theme={theme}
        />
        <IndicatorPill
          label={chartText.histogram}
          value={formatIndicatorValue(macdSeries.latest.histogram)}
          tone={macdSeries.latest.histogram !== null && macdSeries.latest.histogram >= 0 ? "cool" : "warm"}
          theme={theme}
        />
        <IndicatorPill
          label={chartText.zeroLine}
          value="0.00"
          tone="neutral"
          theme={theme}
        />
      </div>

      <div ref={containerRef} className="h-[500px] w-full md:h-[540px]" />
      <div
        ref={latestPricePulseRef}
        className="pointer-events-none absolute z-20 opacity-0 transition-opacity duration-300"
      >
        <span
          className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full animate-ping"
          style={{ background: theme.chart.pulseHalo }}
        />
        <span
          className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{
            borderColor: theme.chart.pulseCore,
            background: theme.chart.priceLine,
            boxShadow: `0 0 0 4px ${theme.chart.pulseHalo}, 0 0 18px ${theme.chart.pulseRing}`,
          }}
        />
      </div>
      {isLoading ? (
        <div
          className="absolute inset-0 flex items-center justify-center backdrop-blur-sm"
          style={{ background: "color-mix(in srgb, var(--theme-panel-strong) 72%, transparent)" }}
        >
          <div
            className="rounded-full border px-4 py-2 text-sm"
            style={{
              borderColor: "var(--theme-chip-border)",
              background: "var(--theme-chip)",
              color: "var(--theme-copy)",
            }}
          >
            {loadingLabel}
          </div>
        </div>
      ) : null}
      {isLoadingMore ? (
        <div
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border px-3 py-1.5 text-xs backdrop-blur-sm"
          style={{
            borderColor: "var(--theme-chip-border)",
            background: "color-mix(in srgb, var(--theme-panel-strong) 86%, transparent)",
            color: "var(--theme-copy)",
          }}
        >
          {loadingLabel}
        </div>
      ) : null}
      <FactorSubcharts
        diagnostics={diagnostics}
        locale={locale}
        factorCopy={factorCopy}
        chartCopy={{
          factorSubcharts: chartText.factorSubcharts,
          factorFixedDaily: chartText.factorFixedDaily,
        }}
        theme={theme}
      />
      <div
        className="mt-3 text-xs tracking-[0.04em]"
        style={{ color: "var(--theme-copy-faint)" }}
      >
        {interactionHint}
      </div>
      <div
        className="mt-4 grid gap-2 text-sm md:grid-cols-3 xl:grid-cols-6"
        style={{ color: "var(--theme-copy)" }}
      >
        <LegendItem
          color={theme.chart.candleUp}
          label={locale === "zh" ? "上涨收盘K线" : "up-close candles"}
        />
        <LegendItem color={theme.chart.overlay} label={overlayLabel} />
        <LegendItem color={theme.chart.macdLine} label={chartText.macdLine} />
        <LegendItem color={theme.chart.macdSignal} label={chartText.signalLine} />
        <LegendItem
          color={theme.chart.histogramPositive}
          label={chartText.histogram}
        />
        <LegendItem
          color={theme.chart.markerExit}
          label={locale === "zh" ? "离场 / 防守" : "exit / defensive"}
        />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function IndicatorPill({
  label,
  value,
  tone,
  theme,
}: {
  label: string;
  value: string;
  tone: "cool" | "warm" | "neutral";
  theme: DashboardTheme;
}) {
  const toneStyle =
    tone === "cool"
      ? {
          borderColor: "color-mix(in srgb, var(--theme-accent) 32%, transparent)",
          background: "color-mix(in srgb, var(--theme-accent) 12%, transparent)",
          color: "var(--theme-copy-strong)",
        }
      : tone === "warm"
        ? {
            borderColor:
              "color-mix(in srgb, var(--theme-accent-3) 36%, transparent)",
            background:
              "color-mix(in srgb, var(--theme-accent-3) 12%, transparent)",
            color: "var(--theme-copy-strong)",
          }
        : {
            borderColor: "var(--theme-chip-border)",
            background: "var(--theme-chip)",
            color: "var(--theme-copy)",
          };

  return (
    <div
      className="rounded-[1rem] border px-3 py-2"
      style={toneStyle}
      data-theme={theme.id}
    >
      <p className="text-[0.66rem] uppercase tracking-[0.2em] opacity-60">{label}</p>
      <p className="mt-1 text-sm font-semibold text-inherit">{value}</p>
    </div>
  );
}

function formatIndicatorValue(value: number | null) {
  if (value === null) {
    return "—";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

function toChartTime(value: string): UTCTimestamp {
  return Math.floor(new Date(value).getTime() / 1000) as UTCTimestamp;
}
