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
import type {
  Candle,
  OverlayPoint,
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
  };
  loadingLabel: string;
  isLoading: boolean;
  isRefreshing: boolean;
  resetKey: string;
  liveBadgeLabel: string;
  refreshBadgeLabel: string;
  lastUpdatedLabel: string | null;
  interactionHint: string;
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
  loadingLabel,
  isLoading,
  isRefreshing,
  resetKey,
  liveBadgeLabel,
  refreshBadgeLabel,
  lastUpdatedLabel,
  interactionHint,
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
  const macdSeries = buildMacdSeries(candles);

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
        background: { type: ColorType.Solid, color: "#101113" },
        textColor: "rgba(241, 236, 226, 0.62)",
        attributionLogo: false,
        panes: {
          enableResize: true,
          separatorColor: "rgba(255,255,255,0.07)",
          separatorHoverColor: "rgba(129, 167, 255, 0.12)",
        },
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: {
          color: "rgba(170, 203, 255, 0.34)",
          width: 1,
          labelBackgroundColor: "#7ba6ff",
        },
        horzLine: {
          color: "rgba(255, 187, 92, 0.22)",
          labelBackgroundColor: "#c78255",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.08)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
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
        upColor: "#bfe2d3",
        downColor: "#d07e57",
        wickUpColor: "#bfe2d3",
        wickDownColor: "#d07e57",
        borderVisible: false,
        priceLineColor: "#c8e2d5",
        lastValueVisible: true,
      },
      0
    );

    const regime = chart.addSeries(
      LineSeries,
      {
        color: "#8aa9ff",
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
        color: "#88abff",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      },
      1
    );
    const macdSignal = chart.addSeries(
      LineSeries,
      {
        color: "#d99a6c",
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
        color: "rgba(255,255,255,0.16)",
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
  }, []);

  useEffect(() => {
    shouldFitContentRef.current = true;
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
            ? "rgba(121, 156, 255, 0.42)"
            : "rgba(255, 187, 92, 0.32)",
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
        color: marker.kind === "entry" ? "#9dd4bc" : "#f3a673",
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
  ]);

  return (
    <div
      ref={wrapperRef}
      className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-[#101113] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.34)]"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[0.72rem] uppercase tracking-[0.24em] text-white/34">
            {locale === "zh" ? "市场回放" : "Market Replay"}
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-[0.02em] text-[#f5eee4]">
            {sourceLabel} · {symbolLabel} · {strategyLabel}
          </h2>
          <p className="mt-2 text-sm text-white/46">
            {chartText.macdPane} · {overlayLabel}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2 text-xs text-white/56">
          <span className="rounded-full border border-[#8aa9ff]/30 bg-[#8aa9ff]/8 px-3 py-1.5 text-[#d9e4ff]">
            {isRefreshing ? refreshBadgeLabel : liveBadgeLabel}
          </span>
          {lastUpdatedLabel ? (
            <span className="rounded-full border border-white/10 px-3 py-1.5">
              {lastUpdatedLabel}
            </span>
          ) : null}
          <span className="rounded-full border border-white/10 px-3 py-1.5">
            {timeframeLabel}
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1.5">
            {candles.length} {locale === "zh" ? "根K线" : "candles"}
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1.5">
            {overlayLabel}
          </span>
        </div>
      </div>

      <div className="mb-3 grid gap-2 text-xs text-white/54 md:grid-cols-4">
        <IndicatorPill
          label={chartText.macdLine}
          value={formatIndicatorValue(macdSeries.latest.macd)}
          tone="cool"
        />
        <IndicatorPill
          label={chartText.signalLine}
          value={formatIndicatorValue(macdSeries.latest.signal)}
          tone="warm"
        />
        <IndicatorPill
          label={chartText.histogram}
          value={formatIndicatorValue(macdSeries.latest.histogram)}
          tone={macdSeries.latest.histogram !== null && macdSeries.latest.histogram >= 0 ? "cool" : "warm"}
        />
        <IndicatorPill label={chartText.zeroLine} value="0.00" tone="neutral" />
      </div>

      <div ref={containerRef} className="h-[500px] w-full md:h-[540px]" />
      <div
        ref={latestPricePulseRef}
        className="pointer-events-none absolute z-20 opacity-0 transition-opacity duration-300"
      >
        <span className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8aa9ff]/16 animate-ping" />
        <span className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#dce6ff]/90 bg-[#8aa9ff] shadow-[0_0_0_4px_rgba(138,169,255,0.15),0_0_18px_rgba(138,169,255,0.5)]" />
      </div>
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#101113]/72 backdrop-blur-sm">
          <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/72">
            {loadingLabel}
          </div>
        </div>
      ) : null}
      <div className="mt-3 text-xs tracking-[0.04em] text-white/34">
        {interactionHint}
      </div>
      <div className="mt-4 grid gap-2 text-sm text-white/56 md:grid-cols-3 xl:grid-cols-6">
        <LegendItem color="#bfe2d3" label={locale === "zh" ? "上涨收盘K线" : "up-close candles"} />
        <LegendItem color="#8aa9ff" label={overlayLabel} />
        <LegendItem color="#88abff" label={chartText.macdLine} />
        <LegendItem color="#d99a6c" label={chartText.signalLine} />
        <LegendItem color="#7ea3ff" label={chartText.histogram} />
        <LegendItem color="#f3a673" label={locale === "zh" ? "离场 / 防守" : "exit / defensive"} />
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
}: {
  label: string;
  value: string;
  tone: "cool" | "warm" | "neutral";
}) {
  const toneClass =
    tone === "cool"
      ? "border-[#88abff]/26 bg-[#88abff]/8 text-[#dae5ff]"
      : tone === "warm"
      ? "border-[#d99a6c]/26 bg-[#d99a6c]/8 text-[#f1d2bb]"
      : "border-white/10 bg-white/[0.03] text-white/64";

  return (
    <div className={`rounded-[1rem] border px-3 py-2 ${toneClass}`}>
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
