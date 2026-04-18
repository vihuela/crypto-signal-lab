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
    <section
      className="rounded-[2rem] border px-6 py-6"
      style={{
        borderColor: "var(--theme-panel-border)",
        background: "var(--theme-panel)",
        boxShadow: "var(--theme-shadow-strong)",
      }}
      data-theme={theme.id}
    >
      <div className="max-w-4xl">
        <p
          className="text-[0.7rem] uppercase tracking-[0.26em]"
          style={{ color: "var(--theme-copy-faint)" }}
        >
          {sectionLabel}
        </p>
        <h2
          className="mt-2 text-2xl font-semibold"
          style={{ color: "var(--theme-title)" }}
        >
          {title}
        </h2>
        <div
          className="mt-3 flex flex-wrap items-center gap-2 text-sm"
          style={{ color: "var(--theme-copy-soft)" }}
        >
          <span
            className="rounded-full border px-3 py-1"
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
              className="rounded-full border px-3 py-1"
              style={{
                borderColor: "var(--theme-chip-active-border)",
                background: "var(--theme-chip-active)",
                color: "var(--theme-copy-strong)",
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
          className="mt-6 rounded-[1.6rem] border px-5 py-10 text-center"
          style={{
            borderColor: "var(--theme-panel-border)",
            background: "var(--theme-panel-muted)",
            color: "var(--theme-copy)",
          }}
        >
          {copy.empty}
        </div>
      ) : null}

      {error ? (
        <div
          className="mt-6 rounded-[1.5rem] border px-4 py-4 text-sm"
          style={{
            background: "color-mix(in srgb, var(--theme-negative) 14%, var(--theme-panel))",
            borderColor: "color-mix(in srgb, var(--theme-negative) 32%, transparent)",
            color: "var(--theme-copy-strong)",
          }}
        >
          {error}
        </div>
      ) : null}

      {leader ? (
        <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(260px,0.75fr)_minmax(0,1.25fr)]">
          <article
            className="rounded-[1.8rem] border px-5 py-5"
            style={{
              borderColor: "var(--theme-panel-border-strong)",
              background: "var(--theme-panel-elevated)",
            }}
          >
            <p
              className="text-[0.68rem] uppercase tracking-[0.24em]"
              style={{ color: "var(--theme-copy-faint)" }}
            >
              {copy.currentLeader}
            </p>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <p
                  className="text-xl font-semibold"
                  style={{ color: "var(--theme-title)" }}
                >
                  {leader.strategy_label}
                </p>
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--theme-copy-soft)" }}
                >
                  {leader.strategy_style}
                </p>
              </div>
              <span
                className="rounded-full border px-3 py-1 text-[0.72rem] uppercase tracking-[0.18em]"
                style={{
                  borderColor: "var(--theme-chip-active-border)",
                  background: "var(--theme-chip-active)",
                  color: "var(--theme-copy-strong)",
                }}
              >
                #1
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
          </article>

          <div className="grid gap-3">
            {entries.map((entry, index) => {
              const isSelected = entry.strategy_id === selectedStrategyId;

              return (
                <button
                  key={entry.strategy_id}
                  type="button"
                  onClick={() => onSelectStrategy(entry.strategy_id as StrategyId)}
                  className="group grid gap-4 rounded-[1.45rem] border px-4 py-4 text-left transition duration-200 ease-out hover:-translate-y-[1px]"
                  style={
                    isSelected
                      ? {
                          borderColor: "var(--theme-control-active-border)",
                          background: "var(--theme-control-active)",
                          boxShadow: "var(--theme-shadow)",
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
                        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] border text-sm font-semibold"
                        style={{
                          borderColor: "var(--theme-panel-border)",
                          background: "var(--theme-panel-strong)",
                          color: "var(--theme-copy-strong)",
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
                              className="rounded-full border px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.18em]"
                              style={{
                                borderColor: "var(--theme-chip-active-border)",
                                background: "var(--theme-chip-active)",
                                color: "var(--theme-copy-strong)",
                              }}
                            >
                              {copy.selected}
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
    </section>
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
      className="rounded-[1.1rem] px-3 py-3"
      style={{ background: "var(--theme-panel-strong)" }}
      data-theme={theme.id}
    >
      <p
        className="text-[0.68rem] uppercase tracking-[0.22em]"
        style={{ color: "var(--theme-copy-faint)" }}
      >
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold" style={{ color: "var(--theme-title)" }}>
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
      className="rounded-[1rem] px-3 py-2.5"
      style={{ background: "var(--theme-panel-strong)" }}
      data-theme={theme.id}
    >
      <p
        className="text-[0.66rem] uppercase tracking-[0.2em]"
        style={{ color: "var(--theme-copy-faint)" }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-sm font-semibold"
        style={{
          color:
            tone === "positive"
              ? "var(--theme-positive)"
              : "var(--theme-copy-strong)",
        }}
      >
        {value}
      </p>
    </div>
  );
}
