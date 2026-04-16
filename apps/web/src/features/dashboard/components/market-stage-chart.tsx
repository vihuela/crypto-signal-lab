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
  type Time,
} from "lightweight-charts";

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
  loadingLabel,
  isLoading,
  isRefreshing,
  resetKey,
  liveBadgeLabel,
  refreshBadgeLabel,
  lastUpdatedLabel,
  interactionHint,
}: MarketStageChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlesticksRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const regimeRef = useRef<ISeriesApi<"Line"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const shouldFitContentRef = useRef(true);

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

    const candlesticks = chart.addSeries(CandlestickSeries, {
      upColor: "#bfe2d3",
      downColor: "#d07e57",
      wickUpColor: "#bfe2d3",
      wickDownColor: "#d07e57",
      borderVisible: false,
      priceLineColor: "#c8e2d5",
      lastValueVisible: true,
    });

    const regime = chart.addSeries(LineSeries, {
      color: "#8aa9ff",
      lineWidth: 2,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
      lastValueVisible: false,
      priceLineVisible: false,
    });

    volume.priceScale().applyOptions({
      scaleMargins: {
        top: 0.82,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candlesticksRef.current = candlesticks;
    regimeRef.current = regime;
    volumeRef.current = volume;
    markersRef.current = createSeriesMarkers(candlesticks, []);

    return () => {
      markersRef.current?.detach();
      markersRef.current = null;
      candlesticksRef.current = null;
      regimeRef.current = null;
      volumeRef.current = null;
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    shouldFitContentRef.current = true;
  }, [resetKey]);

  useEffect(() => {
    if (!candlesticksRef.current || !regimeRef.current || !volumeRef.current) {
      return;
    }

    candlesticksRef.current.setData(candles);
    regimeRef.current.setData(overlay);
    volumeRef.current.setData(
      candles.map((candle, index) => ({
        time: candle.time,
        value: candle.volume,
        color:
          index > 0 && candle.close >= candles[index - 1].close
            ? "rgba(121, 156, 255, 0.42)"
            : "rgba(255, 187, 92, 0.32)",
      }))
    );
    markersRef.current?.setMarkers(
      markers.map((marker) => ({
        time: marker.time,
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
  }, [candles, markerText.entry, markerText.exit, markers, overlay]);

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-[#101113] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.34)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.24em] text-white/34">
            {locale === "zh" ? "市场回放" : "Market Replay"}
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-[0.02em] text-[#f5eee4]">
            {sourceLabel} · {symbolLabel} · {strategyLabel}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-white/56">
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
      <div ref={containerRef} className="h-[420px] w-full" />
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
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/56">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#bfe2d3]" />
          {locale === "zh" ? "上涨收盘K线" : "up-close candles"}
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#8aa9ff]" />
          {overlayLabel}
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f3a673]" />
          {locale === "zh" ? "离场 / 防守" : "exit / defensive"}
        </span>
      </div>
    </div>
  );
}
