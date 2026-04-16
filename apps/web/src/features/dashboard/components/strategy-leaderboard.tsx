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
  copy,
}: StrategyLeaderboardProps) {
  const leader = entries[0];

  return (
    <section className="rounded-[2rem] border border-white/8 bg-[#111317] px-6 py-6 shadow-[0_18px_54px_rgba(0,0,0,0.18)]">
      <div className="max-w-4xl">
        <p className="text-[0.7rem] uppercase tracking-[0.26em] text-white/34">
          {sectionLabel}
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[#f7efe5]">{title}</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/52">
          <span className="rounded-full border border-white/10 px-3 py-1">
            {sourceLabel}
          </span>
          {windowDateRange ? (
            <span className="rounded-full border border-white/10 px-3 py-1">
              {windowDateRange}
            </span>
          ) : null}
          {windowMeta ? (
            <span className="rounded-full border border-white/10 px-3 py-1">
              {windowMeta}
            </span>
          ) : null}
          {buyHoldReturn ? (
            <span className="rounded-full border border-[#89abff]/26 bg-[#89abff]/8 px-3 py-1 text-[#dbe5ff]">
              {copy.buyHold} {buyHoldReturn}
            </span>
          ) : null}
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-white/54">
          {copy.rankedBy} {copy.selectHint}
        </p>
      </div>

      {isLoading && entries.length === 0 ? (
        <div className="mt-6 rounded-[1.6rem] border border-white/8 bg-white/4 px-5 py-10 text-center text-white/56">
          {copy.empty}
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-[1.5rem] bg-[#2a1816] px-4 py-4 text-sm text-[#f4c2b0]">
          {error}
        </div>
      ) : null}

      {leader ? (
        <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(260px,0.75fr)_minmax(0,1.25fr)]">
          <article className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-5 py-5">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-white/36">
              {copy.currentLeader}
            </p>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-semibold text-[#f7efe5]">
                  {leader.strategy_label}
                </p>
                <p className="mt-1 text-sm text-white/48">{leader.strategy_style}</p>
              </div>
              <span className="rounded-full border border-[#8aa9ff]/30 bg-[#8aa9ff]/10 px-3 py-1 text-[0.72rem] uppercase tracking-[0.18em] text-[#dbe5ff]">
                #1
              </span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <MetricTile
                label={copy.edge}
                value={formatPercent(leader.edge_vs_hold_pct, locale)}
              />
              <MetricTile
                label={copy.strategyReturn}
                value={formatPercent(leader.total_return_pct, locale)}
              />
              <MetricTile
                label={copy.drawdown}
                value={formatPercent(leader.max_drawdown_pct, locale)}
              />
              <MetricTile
                label={copy.confidence}
                value={formatPlainNumber(leader.confidence, locale, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
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
                  className={`group grid gap-4 rounded-[1.45rem] border px-4 py-4 text-left transition duration-200 ease-out hover:-translate-y-[1px] ${
                    isSelected
                      ? "border-[#89abff]/44 bg-[linear-gradient(180deg,rgba(137,171,255,0.16),rgba(255,255,255,0.05))] shadow-[0_12px_30px_rgba(15,18,28,0.26)]"
                      : "border-white/8 bg-white/4 hover:border-white/14 hover:bg-white/[0.055]"
                  }`}
                >
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex items-start gap-4">
                      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] border border-white/10 bg-black/20 text-sm font-semibold text-[#f7efe5]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold text-[#f7efe5]">
                            {entry.strategy_label}
                          </p>
                          {isSelected ? (
                            <span className="rounded-full border border-[#8aa9ff]/36 bg-[#8aa9ff]/10 px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.18em] text-[#dbe5ff]">
                              {copy.selected}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-white/48">
                          {entry.strategy_style} · {biasLabels[entry.strategy_bias]}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2 text-right sm:grid-cols-2 xl:min-w-[320px] xl:grid-cols-3">
                      <ScorePill
                        label={copy.edge}
                        value={formatPercent(entry.edge_vs_hold_pct, locale)}
                        tone={entry.edge_vs_hold_pct >= 0 ? "positive" : "muted"}
                      />
                      <ScorePill
                        label={copy.strategyReturn}
                        value={formatPercent(entry.total_return_pct, locale)}
                        tone={entry.total_return_pct >= 0 ? "positive" : "muted"}
                      />
                      <ScorePill
                        label={copy.drawdown}
                        value={formatPercent(entry.max_drawdown_pct, locale)}
                        tone="muted"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm text-white/52 sm:grid-cols-3">
                    <span>
                      {copy.winRate}{" "}
                      <strong className="font-medium text-white/72">
                        {formatPercent(entry.win_rate_pct, locale, {
                          signDisplay: "never",
                        })}
                      </strong>
                    </span>
                    <span>
                      {copy.trades}{" "}
                      <strong className="font-medium text-white/72">
                        {entry.trade_count}
                      </strong>
                    </span>
                    <span>
                      {copy.confidence}{" "}
                      <strong className="font-medium text-white/72">
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

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.1rem] bg-black/18 px-3 py-3">
      <p className="text-[0.68rem] uppercase tracking-[0.22em] text-white/32">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-[#f7efe5]">{value}</p>
    </div>
  );
}

function ScorePill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "positive" | "muted";
}) {
  return (
    <div className="rounded-[1rem] bg-black/18 px-3 py-2.5">
      <p className="text-[0.66rem] uppercase tracking-[0.2em] text-white/32">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-semibold ${
          tone === "positive" ? "text-[#cfe2ff]" : "text-[#f7efe5]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
