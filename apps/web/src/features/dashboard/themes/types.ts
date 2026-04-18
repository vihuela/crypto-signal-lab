import type { CSSProperties } from "react";

export type DashboardThemeId =
  | "neon-grid";

export type DashboardChartTheme = {
  background: string;
  textColor: string;
  paneSeparator: string;
  paneSeparatorHover: string;
  gridVertical: string;
  gridHorizontal: string;
  crosshairCool: string;
  crosshairCoolLabel: string;
  crosshairWarm: string;
  crosshairWarmLabel: string;
  border: string;
  candleUp: string;
  candleDown: string;
  priceLine: string;
  overlay: string;
  volumeUp: string;
  volumeDown: string;
  macdLine: string;
  macdSignal: string;
  macdZero: string;
  histogramPositive: string;
  histogramNegative: string;
  markerEntry: string;
  markerExit: string;
  pulseHalo: string;
  pulseCore: string;
  pulseRing: string;
};

export type DashboardTheme = {
  id: DashboardThemeId;
  label: string;
  kicker: string;
  description: string;
  references: string[];
  vars: Record<`--${string}`, string>;
  chart: DashboardChartTheme;
};

export function getThemeStyle(theme: DashboardTheme): CSSProperties {
  return theme.vars as CSSProperties;
}
