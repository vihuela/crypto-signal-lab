"use client";

import { ActivitySquare } from "lucide-react";

import {
  formatCompactUsd,
  formatDate,
  formatPlainNumber,
} from "@/features/dashboard/formatters";
import type { DashboardTheme } from "@/features/dashboard/themes/types";
import type {
  FactorId,
  FactorSourceMode,
  ReplayResponse,
} from "@/features/dashboard/types";
import type { Locale } from "@/features/i18n/dictionaries";

type FactorCopy = {
  long: string;
  defensive: string;
  neutral: string;
  live: string;
  proxy: string;
  unavailable: string;
  factorNames: Record<FactorId, string>;
  sources: Record<FactorId, Record<FactorSourceMode, string>>;
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

type ChartCopy = {
  factorSubcharts: string;
  factorFixedDaily: string;
};

type Props = {
  diagnostics: ReplayResponse["diagnostics"];
  locale: Locale;
  factorCopy: FactorCopy;
  chartCopy: ChartCopy;
  theme: DashboardTheme;
};

export function FactorSubcharts({
  diagnostics,
  locale,
  factorCopy,
  chartCopy,
  theme,
}: Props) {
  if (!diagnostics || diagnostics.factor_series.length === 0) {
    return null;
  }

  const readingMap = new Map(
    diagnostics.factors.map((factor) => [factor.factor_id, factor])
  );

  return (
    <section
      className="mt-6 border-t pt-5"
      style={{ borderColor: "var(--theme-panel-border)" }}
      data-theme={theme.id}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p
            className="text-[0.72rem] uppercase tracking-[0.24em]"
            style={{ color: "var(--theme-copy-faint)" }}
          >
            {chartCopy.factorSubcharts}
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--theme-copy-soft)" }}>
            {chartCopy.factorFixedDaily}
          </p>
        </div>
        <ActivitySquare
          className="h-4.5 w-4.5"
          style={{ color: "var(--theme-accent)" }}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {diagnostics.factor_series.map((series) => {
          const reading = readingMap.get(series.factor_id);
          if (!reading) {
            return null;
          }

          return (
            <MiniFactorCard
              key={series.factor_id}
              series={series}
              reading={reading}
              locale={locale}
              factorCopy={factorCopy}
              theme={theme}
            />
          );
        })}
      </div>
    </section>
  );
}

function MiniFactorCard({
  series,
  reading,
  locale,
  factorCopy,
  theme,
}: {
  series: NonNullable<ReplayResponse["diagnostics"]>["factor_series"][number];
  reading: NonNullable<ReplayResponse["diagnostics"]>["factors"][number];
  locale: Locale;
  factorCopy: FactorCopy;
  theme: DashboardTheme;
}) {
  const status = reading.long_signal
    ? "bullish"
    : reading.defensive_signal
      ? "defensive"
      : "neutral";
  const lineColor =
    status === "bullish"
      ? theme.vars["--theme-positive"]
      : status === "defensive"
        ? theme.vars["--theme-negative"]
        : theme.vars["--theme-accent"];
  const areaColor =
    `color-mix(in srgb, ${lineColor} 16%, transparent)`;
  const statusColor =
    status === "bullish"
      ? "var(--theme-positive)"
      : status === "defensive"
        ? "var(--theme-negative)"
        : "var(--theme-neutral)";

  return (
    <article
      className="rounded-[1.2rem] border px-4 py-4"
      style={{
        borderColor: "var(--theme-panel-border)",
        background: "var(--theme-panel-muted)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="truncate text-[0.95rem] font-semibold"
            style={{ color: "var(--theme-copy-strong)" }}
          >
            {factorCopy.factorNames[series.factor_id]}
          </p>
          <p className="mt-1 text-[0.78rem]" style={{ color: "var(--theme-copy-soft)" }}>
            {factorCopy.sources[series.factor_id][series.source_mode]} ·{" "}
            {sourceModeLabel(factorCopy, series.source_mode)}
          </p>
        </div>
        <div className="text-right">
          <p
            className="text-[0.92rem] font-semibold tabular-nums"
            style={{ color: "var(--theme-title)" }}
          >
            {formatFactorValue(reading, locale, factorCopy)}
          </p>
          <p
            className="mt-1 text-[0.72rem] uppercase tracking-[0.18em]"
            style={{ color: statusColor }}
          >
            {statusLabel(series.factor_id, reading.value, status, factorCopy)}
          </p>
        </div>
      </div>

      <div
        className="mt-4 overflow-hidden rounded-[0.9rem] border"
        style={{
          borderColor: "var(--theme-panel-border)",
          background: "var(--theme-panel-strong)",
        }}
      >
        <MiniSparkline
          points={series.points}
          lineColor={lineColor}
          areaColor={areaColor}
        />
      </div>
      <MiniTimeline points={series.points} locale={locale} />
    </article>
  );
}

function MiniSparkline({
  points,
  lineColor,
  areaColor,
}: {
  points: NonNullable<ReplayResponse["diagnostics"]>["factor_series"][number]["points"];
  lineColor: string;
  areaColor: string;
}) {
  const width = 300;
  const height = 88;
  const padding = 10;
  const valid = points
    .map((point, index) => ({ ...point, index }))
    .filter((point) => point.value !== null) as Array<{
    time: string;
    value: number;
    index: number;
  }>;

  if (valid.length === 0) {
    return (
      <div className="flex h-[88px] items-center justify-center text-xs text-white/28">
        —
      </div>
    );
  }

  let min = valid[0].value;
  let max = valid[0].value;
  for (const point of valid) {
    min = Math.min(min, point.value);
    max = Math.max(max, point.value);
  }
  if (min === max) {
    min -= 1;
    max += 1;
  }

  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const total = Math.max(points.length - 1, 1);
  const tickIndexes = [0, Math.floor(total / 2), total];
  const coords = valid.map((point) => {
    const x = padding + (point.index / total) * chartWidth;
    const normalized = (point.value - min) / (max - min);
    const y = padding + (1 - normalized) * chartHeight;
    return { x, y };
  });
  const path = coords
    .map((coord, index) => `${index === 0 ? "M" : "L"} ${coord.x} ${coord.y}`)
    .join(" ");
  const areaPath = `${path} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${height - padding} Z`;
  const latest = coords[coords.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-[88px] w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {tickIndexes.map((index) => {
        const x = padding + (index / total) * chartWidth;
        return (
          <line
            key={index}
            x1={x}
            y1={padding}
            x2={x}
            y2={height - padding}
            stroke="var(--theme-panel-border)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
        );
      })}
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="var(--theme-panel-border)"
        strokeWidth="1"
      />
      <path d={areaPath} fill={areaColor} />
      <path
        d={path}
        fill="none"
        stroke={lineColor}
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={latest.x} cy={latest.y} r="3.4" fill={lineColor} />
    </svg>
  );
}

function MiniTimeline({
  points,
  locale,
}: {
  points: NonNullable<ReplayResponse["diagnostics"]>["factor_series"][number]["points"];
  locale: Locale;
}) {
  if (points.length === 0) {
    return null;
  }

  const start = points[0]?.time;
  const middle = points[Math.floor((points.length - 1) / 2)]?.time;
  const end = points[points.length - 1]?.time;

  if (!start || !middle || !end) {
    return null;
  }

  return (
    <div
      className="mt-2 grid grid-cols-3 text-[0.68rem] tabular-nums"
      style={{ color: "var(--theme-copy-faint)" }}
    >
      <span>{formatDate(start, locale)}</span>
      <span className="text-center">{formatDate(middle, locale)}</span>
      <span className="text-right">{formatDate(end, locale)}</span>
    </div>
  );
}

function sourceModeLabel(copy: FactorCopy, mode: FactorSourceMode) {
  if (mode === "live") return copy.live;
  if (mode === "proxy") return copy.proxy;
  return copy.unavailable;
}

function statusLabel(
  factorId: FactorId,
  value: number | null,
  status: "bullish" | "neutral" | "defensive",
  copy: FactorCopy
) {
  if (factorId === "fear_greed") {
    if (status === "bullish") return copy.fearLabels.bullish;
    if ((value ?? 0) >= 75) return copy.fearLabels.defensive;
    return copy.fearLabels.neutral;
  }
  if (factorId === "macro_regime") {
    if (status === "bullish") return copy.macroLabels.bullish;
    if (status === "defensive") return copy.macroLabels.defensive;
    return copy.macroLabels.neutral;
  }
  if (status === "bullish") return copy.long;
  if (status === "defensive") return copy.defensive;
  return copy.neutral;
}

function formatFactorValue(
  factor: NonNullable<ReplayResponse["diagnostics"]>["factors"][number],
  locale: Locale,
  copy: FactorCopy
) {
  if (factor.value === null) {
    return copy.unavailable;
  }

  switch (factor.factor_id) {
    case "fear_greed":
      return formatPlainNumber(factor.value, locale, { maximumFractionDigits: 0 });
    case "mvrv_z":
      return formatPlainNumber(factor.value, locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    case "sopr":
      return formatPlainNumber(factor.value, locale, {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      });
    case "etf_flow_5d_usd":
      return factor.source_mode === "live"
        ? formatCompactUsd(factor.value, locale)
        : formatPlainNumber(factor.value, locale, {
            notation: "compact",
            signDisplay: "always",
            maximumFractionDigits: 2,
          });
    case "macro_regime":
      if (factor.value > 0) return copy.macroLabels.bullish;
      if (factor.value < 0) return copy.macroLabels.defensive;
      return copy.macroLabels.neutral;
    default:
      return formatPlainNumber(factor.value, locale);
  }
}
