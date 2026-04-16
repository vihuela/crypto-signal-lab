import type { Locale } from "@/features/i18n/dictionaries";
import type { Timeframe } from "@/features/dashboard/types";

type PercentSignDisplay = "auto" | "always" | "exceptZero" | "negative" | "never";

export function formatUsd(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : value >= 1 ? 2 : 4,
  }).format(value);
}

export function formatPercent(
  value: number,
  locale: Locale,
  options?: { signDisplay?: PercentSignDisplay }
) {
  const formatter = new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: options?.signDisplay ?? "always",
  });
  return `${formatter.format(value)}%`;
}

export function formatPlainNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
) {
  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

export function formatTime(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function formatDate(
  value: string,
  locale: Locale,
  options?: { includeTime?: boolean }
) {
  const date = new Date(value);
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(options?.includeTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }
      : {}),
    timeZone: "UTC",
  }).format(date);
}

export function formatDatasetWindow({
  start,
  end,
  candleCount,
  timeframeLabel,
  candlesLabel,
  timeframe,
  locale,
}: {
  start: string;
  end: string;
  candleCount: number;
  timeframeLabel: string;
  candlesLabel: string;
  timeframe: Timeframe;
  locale: Locale;
}) {
  const includeTime = isIntradayTimeframe(timeframe);

  return {
    dateRange: `${formatDate(start, locale, { includeTime })} - ${formatDate(end, locale, {
      includeTime,
    })}`,
    meta: `${candleCount} ${candlesLabel} · ${timeframeLabel}`,
  };
}

export function isIntradayTimeframe(timeframe: Timeframe) {
  return timeframe === "15m" || timeframe === "1h" || timeframe === "4h";
}
