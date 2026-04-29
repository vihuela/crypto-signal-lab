"use client";

import type {
  Bias,
  StrategyId,
  StrategyLeaderboardEntry,
} from "@/features/dashboard/types";
import {
  formatPercent,
  formatPlainNumber,
} from "@/features/dashboard/formatters";
import { HudFrame } from "@/features/dashboard/components/hud-frame";
import type { DashboardTheme } from "@/features/dashboard/themes/types";
import type { Locale } from "@/features/i18n/dictionaries";

type StrategyLeaderboardProps = {
  entries: StrategyLeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
  locale: Locale;
  sectionLabel: string;
  title: string;
  sourceLabel: string;
  windowDateRange: string | null;
  windowMeta: string | null;
  buyHoldReturn: string | null;
  selectedStrategyId: StrategyId;
  onSelectStrategy: (strategyId: StrategyId) => void;
  biasLabels: Record<Bias, string>;
  theme: DashboardTheme;
  copy: {
    currentLeader: string;
    rankedBy: string;
    selectHint: string;
    selected: string;
    strategyReturn: string;
    edge: string;
    drawdown: string;
    winRate: string;
    trades: string;
    confidence: string;
    buyHold: string;
    empty: string;
  };
};

export function StrategyLeaderboard({
  entries,
  isLoading,
  error,
  locale,
  sectionLabel,
  title,
  sourceLabel,
  windowDateRange,
  windowMeta,
  buyHoldReturn,
  selectedStrategyId,
  onSelectStrategy,
  biasLabels,
  theme,
  copy,
}: StrategyLeaderboardProps) {
  const leader = entries[0];

  return (
    <HudFrame
      className="cyber-clip border px-6 py-6"
      style={{
        borderColor: "var(--theme-panel-border)",
        background: "var(--theme-panel)",
        boxShadow: "var(--theme-shadow-strong)",
      }}
    >
      <div data-theme={theme.id} className="max-w-4xl">
        <p
          className="font-mono-data text-[0.66rem] uppercase tracking-[0.26em] neon-text-magenta"
        >
          {`// ${sectionLabel}`}
        </p>
        <h2
          className="mt-2 text-2xl font-semibold neon-text"
          style={{ color: "var(--theme-title)" }}
        >
          {title}
        </h2>
        <div
          className="mt-3 flex flex-wrap items-center gap-2 text-sm"
          style={{ color: "var(--theme-copy-soft)" }}
        >
          <span
            className="font-mono-data uppercase tracking-[0.14em] cyber-clip border px-3 py-1"
            style={{
              borderColor: "var(--theme-chip-border)",
              background: "var(--theme-chip)",
            }}
          >
            {sourceLabel}
          </span>
          {windowDateRange ? (
            <span
              className="rounded-full border px-3 py-1"
              style={{
                borderColor: "var(--theme-chip-border)",
                background: "var(--theme-chip)",
              }}
            >
              {windowDateRange}
            </span>
          ) : null}
          {windowMeta ? (
            <span
              className="rounded-full border px-3 py-1"
              style={{
                borderColor: "var(--theme-chip-border)",
                background: "var(--theme-chip)",
              }}
            >
              {windowMeta}
            </span>
          ) : null}
          {buyHoldReturn ? (
            <span
              className="font-mono-data uppercase tracking-[0.14em] cyber-clip border px-3 py-1 neon-text-magenta"
              style={{
                borderColor: "var(--theme-chip-active-border)",
                background: "var(--theme-chip-active)",
              }}
            >
              {copy.buyHold} {buyHoldReturn}
            </span>
          ) : null}
        </div>
        <p
          className="mt-4 max-w-3xl text-sm leading-6"
          style={{ color: "var(--theme-copy)" }}
        >
          {copy.rankedBy} {copy.selectHint}
        </p>
      </div>

      {isLoading && entries.length === 0 ? (
        <div
          className="mt-6 cyber-clip border px-5 py-10 text-center font-mono-data uppercase tracking-[0.14em]"
          style={{
            borderColor: "var(--theme-panel-border)",
            background: "var(--theme-panel-muted)",
            color: "var(--theme-copy)",
          }}
        >
          {`// ${copy.empty}`}
        </div>
      ) : null}

      {error ? (
        <div
          className="mt-6 cyber-clip border px-4 py-4 text-sm font-mono-data"
          style={{
            background: "color-mix(in srgb, var(--theme-negative) 14%, var(--theme-panel))",
            borderColor: "color-mix(in srgb, var(--theme-negative) 50%, transparent)",
            color: "var(--theme-copy-strong)",
          }}
        >
          {`!! ${error}`}
        </div>
      ) : null}

      {leader ? (
        <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(260px,0.75fr)_minmax(0,1.25fr)]">
          <HudFrame
            accent="cyan"
            className="cyber-clip border px-5 py-5"
            style={{
              borderColor: "var(--theme-panel-border-strong)",
              background: "var(--theme-panel-elevated)",
            }}
          >
            <p
              className="font-mono-data text-[0.66rem] uppercase tracking-[0.24em] neon-text-cyan"
            >
              {`// ${copy.currentLeader}`}
            </p>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <p
                  className="text-xl font-semibold neon-text"
                  style={{ color: "var(--theme-title)" }}
                >
                  {leader.strategy_label}
                </p>
                <p
                  className="mt-1 font-mono-data text-[0.82rem] uppercase tracking-[0.14em]"
                  style={{ color: "var(--theme-copy-soft)" }}
                >
                  {leader.strategy_style}
                </p>
              </div>
              <span
                className="cyber-clip border px-3 py-1 font-mono-data text-[0.74rem] uppercase tracking-[0.2em] neon-text-magenta"
                style={{
                  borderColor: "var(--theme-chip-active-border)",
                  background: "var(--theme-chip-active)",
                }}
              >
                ##01
              </span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <MetricTile
                label={copy.edge}
                value={formatPercent(leader.edge_vs_hold_pct, locale)}
                theme={theme}
              />
              <MetricTile
                label={copy.strategyReturn}
                value={formatPercent(leader.total_return_pct, locale)}
                theme={theme}
              />
              <MetricTile
                label={copy.drawdown}
                value={formatPercent(leader.max_drawdown_pct, locale)}
                theme={theme}
              />
              <MetricTile
                label={copy.confidence}
                value={formatPlainNumber(leader.confidence, locale, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                theme={theme}
              />
            </div>
          </HudFrame>

          <div className="grid gap-3">
            {entries.map((entry, index) => {
              const isSelected = entry.strategy_id === selectedStrategyId;

              return (
                <button
                  key={entry.strategy_id}
                  type="button"
                  onClick={() => onSelectStrategy(entry.strategy_id as StrategyId)}
                  className="group grid gap-4 cyber-clip border px-4 py-4 text-left transition duration-200 ease-out hover:-translate-y-[1px]"
                  style={
                    isSelected
                      ? {
                          borderColor: "var(--theme-control-active-border)",
                          background: "var(--theme-control-active)",
                          boxShadow: "var(--theme-shadow)",
                          borderLeftWidth: "3px",
                          borderLeftColor: "var(--theme-accent-2)",
                        }
                      : {
                          borderColor: "var(--theme-panel-border)",
                          background: "var(--theme-panel-muted)",
                        }
                  }
                >
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex items-start gap-4">
                      <span
                        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center cyber-clip border font-mono-data text-sm font-semibold tabular-nums"
                        style={{
                          borderColor: isSelected
                            ? "var(--theme-accent-2)"
                            : "var(--theme-panel-border)",
                          background: "var(--theme-panel-strong)",
                          color: isSelected
                            ? "var(--theme-accent-2)"
                            : "var(--theme-copy-strong)",
                          textShadow: isSelected
                            ? "0 0 8px rgba(0,240,255,0.6)"
                            : "none",
                        }}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className="text-lg font-semibold"
                            style={{ color: "var(--theme-title)" }}
                          >
                            {entry.strategy_label}
                          </p>
                          {isSelected ? (
                            <span
                              className="cyber-clip border px-2.5 py-1 font-mono-data text-[0.66rem] uppercase tracking-[0.18em] neon-text-cyan"
                              style={{
                                borderColor: "var(--theme-chip-active-border)",
                                background: "var(--theme-chip-active)",
                              }}
                            >
                              {`[ ${copy.selected} ]`}
                            </span>
                          ) : null}
                        </div>
                        <p
                          className="mt-1 text-sm"
                          style={{ color: "var(--theme-copy-soft)" }}
                        >
                          {entry.strategy_style} · {biasLabels[entry.strategy_bias]}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2 text-right sm:grid-cols-2 xl:min-w-[320px] xl:grid-cols-3">
                      <ScorePill
                        label={copy.edge}
                        value={formatPercent(entry.edge_vs_hold_pct, locale)}
                        tone={entry.edge_vs_hold_pct >= 0 ? "positive" : "muted"}
                        theme={theme}
                      />
                      <ScorePill
                        label={copy.strategyReturn}
                        value={formatPercent(entry.total_return_pct, locale)}
                        tone={entry.total_return_pct >= 0 ? "positive" : "muted"}
                        theme={theme}
                      />
                      <ScorePill
                        label={copy.drawdown}
                        value={formatPercent(entry.max_drawdown_pct, locale)}
                        tone="muted"
                        theme={theme}
                      />
                    </div>
                  </div>

                  <div
                    className="grid gap-2 text-sm sm:grid-cols-3"
                    style={{ color: "var(--theme-copy)" }}
                  >
                    <span>
                      {copy.winRate}{" "}
                      <strong
                        className="font-medium"
                        style={{ color: "var(--theme-copy-strong)" }}
                      >
                        {formatPercent(entry.win_rate_pct, locale, {
                          signDisplay: "never",
                        })}
                      </strong>
                    </span>
                    <span>
                      {copy.trades}{" "}
                      <strong
                        className="font-medium"
                        style={{ color: "var(--theme-copy-strong)" }}
                      >
                        {entry.trade_count}
                      </strong>
                    </span>
                    <span>
                      {copy.confidence}{" "}
                      <strong
                        className="font-medium"
                        style={{ color: "var(--theme-copy-strong)" }}
                      >
                        {formatPlainNumber(entry.confidence, locale, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </strong>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </HudFrame>
  );
}

function MetricTile({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: DashboardTheme;
}) {
  return (
    <div
      className="cyber-clip border px-3 py-3"
      style={{
        background: "var(--theme-panel-strong)",
        borderColor: "var(--theme-panel-border)",
        borderLeft: "2px solid var(--theme-accent)",
      }}
      data-theme={theme.id}
    >
      <p
        className="font-mono-data text-[0.62rem] uppercase tracking-[0.22em] neon-text-magenta"
      >
        {`> ${label}`}
      </p>
      <p
        className="mt-2 font-mono-data text-lg font-semibold tabular-nums"
        style={{ color: "var(--theme-title)" }}
      >
        {value}
      </p>
    </div>
  );
}

function ScorePill({
  label,
  value,
  tone,
  theme,
}: {
  label: string;
  value: string;
  tone: "positive" | "muted";
  theme: DashboardTheme;
}) {
  return (
    <div
      className="cyber-clip px-3 py-2.5"
      style={{
        background: "var(--theme-panel-strong)",
        borderLeft: tone === "positive"
          ? "2px solid var(--theme-positive)"
          : "2px solid var(--theme-panel-border)",
      }}
      data-theme={theme.id}
    >
      <p
        className="font-mono-data text-[0.62rem] uppercase tracking-[0.2em]"
        style={{ color: "var(--theme-copy-faint)" }}
      >
        {label}
      </p>
      <p
        className="mt-1 font-mono-data text-sm font-semibold tabular-nums"
        style={{
          color:
            tone === "positive"
              ? "var(--theme-positive)"
              : "var(--theme-copy-strong)",
          textShadow:
            tone === "positive"
              ? "0 0 8px rgba(57,255,20,0.45)"
              : "none",
        }}
      >
        {value}
      </p>
    </div>
  );
}
