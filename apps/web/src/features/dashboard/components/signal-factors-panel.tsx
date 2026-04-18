"use client";

import { Activity, Database } from "lucide-react";

import { formatCompactUsd, formatPlainNumber } from "@/features/dashboard/formatters";
import type { DashboardTheme } from "@/features/dashboard/themes/types";
import type {
  FactorId,
  FactorSourceMode,
  ReplayResponse,
} from "@/features/dashboard/types";
import type { Locale } from "@/features/i18n/dictionaries";

type PanelCopy = {
  coreResonance: string;
  fearAux: string;
  ready: string;
  standby: string;
  longScore: string;
  defensiveScore: string;
  long: string;
  defensive: string;
  neutral: string;
  live: string;
  proxy: string;
  unavailable: string;
  factorNames: Record<FactorId, string>;
  sources: Record<
    FactorId,
    Record<FactorSourceMode, string>
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

type Props = {
  diagnostics: ReplayResponse["diagnostics"];
  locale: Locale;
  sectionLabel: string;
  copy: PanelCopy;
  theme: DashboardTheme;
};

export function SignalFactorsPanel({
  diagnostics,
  locale,
  sectionLabel,
  copy,
  theme,
}: Props) {
  if (!diagnostics) {
    return null;
  }

  const resonanceReady =
    diagnostics.core_long_count >= diagnostics.resonance_threshold;

  return (
    <section
      className="rounded-2xl border px-6 py-6"
      style={{
        borderColor: "var(--theme-panel-border)",
        background: "var(--theme-panel)",
        boxShadow: "var(--theme-shadow)",
      }}
      data-theme={theme.id}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className="text-[0.68rem] uppercase tracking-[0.28em]"
            style={{ color: "var(--theme-copy-faint)" }}
          >
            {sectionLabel}
          </p>
          <h2
            className="mt-3 text-2xl font-semibold tracking-[-0.015em]"
            style={{ color: "var(--theme-title)" }}
          >
            {diagnostics.core_long_count} / {diagnostics.core_factor_count}
          </h2>
          <p className="mt-2 text-[0.92rem]" style={{ color: "var(--theme-copy)" }}>
            {resonanceReady ? copy.ready : copy.standby}
          </p>
        </div>
        <Activity
          className="mt-1 h-5 w-5"
          style={{ color: "var(--theme-accent)" }}
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <SummaryPill
          label={copy.coreResonance}
          value={`${diagnostics.core_long_count}/${diagnostics.core_factor_count}`}
          tone={resonanceReady ? "bullish" : "neutral"}
          theme={theme}
        />
        <SummaryPill
          label={copy.longScore}
          value={formatPlainNumber(diagnostics.long_score, locale, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}
          tone="bullish"
          theme={theme}
        />
        <SummaryPill
          label={copy.defensiveScore}
          value={formatPlainNumber(diagnostics.defensive_score, locale, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}
          tone={diagnostics.defensive_score >= 2 ? "defensive" : "neutral"}
          theme={theme}
        />
      </div>

      <div
        className="mt-6 rounded-xl border px-4 py-3"
        style={{
          borderColor: "var(--theme-panel-border)",
          background: "var(--theme-panel-muted)",
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p
              className="text-[0.72rem] uppercase tracking-[0.22em]"
              style={{ color: "var(--theme-copy-faint)" }}
            >
              {copy.fearAux}
            </p>
            <p
              className="mt-2 text-[0.95rem] font-medium"
              style={{ color: "var(--theme-copy-strong)" }}
            >
              {diagnostics.fear_active ? copy.ready : copy.standby}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[0.82rem]" style={{ color: "var(--theme-copy-soft)" }}>
              +{formatPlainNumber(diagnostics.fear_weight, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </p>
          </div>
        </div>
      </div>

      <div
        className="mt-6 divide-y border-t"
        style={{
          borderColor: "var(--theme-panel-border)",
          color: "var(--theme-copy)",
        }}
      >
        {diagnostics.factors.map((factor) => {
          const status = factor.long_signal
            ? "bullish"
            : factor.defensive_signal
              ? "defensive"
              : "neutral";
          const statusColor =
            status === "bullish"
              ? "var(--theme-positive)"
              : status === "defensive"
                ? "var(--theme-negative)"
                : "var(--theme-neutral)";

          return (
            <article key={factor.factor_id} className="py-4 first:pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: statusColor }}
                    />
                    <p
                      className="truncate text-[0.98rem] font-semibold"
                      style={{ color: "var(--theme-copy-strong)" }}
                    >
                      {copy.factorNames[factor.factor_id]}
                    </p>
                  </div>
                  <div
                    className="mt-2 flex flex-wrap items-center gap-2 text-[0.78rem]"
                    style={{ color: "var(--theme-copy-soft)" }}
                  >
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1"
                      style={{
                        borderColor: "var(--theme-chip-border)",
                        background: "var(--theme-chip)",
                      }}
                    >
                      <Database className="h-3 w-3" />
                      {copy.sources[factor.factor_id][factor.source_mode]}
                    </span>
                    <span
                      className="inline-flex items-center rounded-full border px-2.5 py-1"
                      style={{
                        borderColor: "var(--theme-chip-border)",
                        background: "var(--theme-chip)",
                      }}
                    >
                      {sourceModeLabel(copy, factor.source_mode)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className="text-[0.98rem] font-semibold tabular-nums"
                    style={{ color: "var(--theme-title)" }}
                  >
                    {formatFactorValue(factor, locale, copy)}
                  </p>
                  <p
                    className="mt-2 text-[0.78rem] uppercase tracking-[0.18em]"
                    style={{ color: statusColor }}
                  >
                    {statusLabel(factor.factor_id, factor.value, status, copy)}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SummaryPill({
  label,
  value,
  tone,
  theme,
}: {
  label: string;
  value: string;
  tone: "bullish" | "neutral" | "defensive";
  theme: DashboardTheme;
}) {
  const toneColor =
    tone === "bullish"
      ? "var(--theme-positive)"
      : tone === "defensive"
        ? "var(--theme-negative)"
        : "var(--theme-copy-strong)";

  return (
    <div
      className="rounded-xl border px-4 py-3"
      style={{
        borderColor: "var(--theme-panel-border)",
        background: "var(--theme-panel-muted)",
      }}
      data-theme={theme.id}
    >
      <p
        className="text-[0.72rem] uppercase tracking-[0.22em]"
        style={{ color: "var(--theme-copy-faint)" }}
      >
        {label}
      </p>
      <p className="mt-2 text-[1.05rem] font-semibold" style={{ color: toneColor }}>
        {value}
      </p>
    </div>
  );
}

function sourceModeLabel(copy: PanelCopy, mode: FactorSourceMode) {
  if (mode === "live") return copy.live;
  if (mode === "proxy") return copy.proxy;
  return copy.unavailable;
}

function statusLabel(
  factorId: FactorId,
  value: number | null,
  status: "bullish" | "neutral" | "defensive",
  copy: PanelCopy
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
  copy: PanelCopy
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
