import type { Candle } from "@/features/dashboard/types";

type LinePoint = {
  time: string;
  value: number;
};

type HistogramPoint = LinePoint & {
  color: string;
};

export type MacdSeries = {
  macdLine: LinePoint[];
  signalLine: LinePoint[];
  histogram: HistogramPoint[];
  zeroLine: LinePoint[];
  latest: {
    macd: number | null;
    signal: number | null;
    histogram: number | null;
  };
};

type MacdSeriesColors = {
  positiveHistogram: string;
  negativeHistogram: string;
};

export function buildMacdSeries(
  candles: Candle[],
  colors: MacdSeriesColors = {
    positiveHistogram: "rgba(129, 167, 255, 0.72)",
    negativeHistogram: "rgba(218, 146, 101, 0.72)",
  }
): MacdSeries {
  if (candles.length === 0) {
    return {
      macdLine: [],
      signalLine: [],
      histogram: [],
      zeroLine: [],
      latest: {
        macd: null,
        signal: null,
        histogram: null,
      },
    };
  }

  const closes = candles.map((candle) => candle.close);
  const fast = ema(closes, 12);
  const slow = ema(closes, 26);
  const macdValues = closes.map((_, index) => {
    const fastValue = fast[index];
    const slowValue = slow[index];
    if (fastValue === null || slowValue === null) {
      return null;
    }
    return fastValue - slowValue;
  });
  const signalValues = emaNullable(macdValues, 9);

  const macdLine: LinePoint[] = [];
  const signalLine: LinePoint[] = [];
  const histogram: HistogramPoint[] = [];
  const zeroLine: LinePoint[] = [];

  candles.forEach((candle, index) => {
    const macdValue = macdValues[index];
    const signalValue = signalValues[index];
    if (macdValue !== null) {
      macdLine.push({
        time: candle.time,
        value: roundTo(macdValue, 4),
      });
      zeroLine.push({
        time: candle.time,
        value: 0,
      });
    }
    if (signalValue !== null) {
      signalLine.push({
        time: candle.time,
        value: roundTo(signalValue, 4),
      });
    }
    if (macdValue !== null && signalValue !== null) {
      const histogramValue = macdValue - signalValue;
      histogram.push({
        time: candle.time,
        value: roundTo(histogramValue, 4),
        color:
          histogramValue >= 0
            ? colors.positiveHistogram
            : colors.negativeHistogram,
      });
    }
  });

  return {
    macdLine,
    signalLine,
    histogram,
    zeroLine,
    latest: {
      macd: lastValue(macdLine),
      signal: lastValue(signalLine),
      histogram: lastValue(histogram),
    },
  };
}

function ema(values: number[], period: number): Array<number | null> {
  const result: Array<number | null> = Array(values.length).fill(null);
  if (values.length < period) {
    return result;
  }

  const seed = values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  result[period - 1] = seed;
  const multiplier = 2 / (period + 1);
  let previous = seed;

  for (let index = period; index < values.length; index += 1) {
    previous = ((values[index] - previous) * multiplier) + previous;
    result[index] = previous;
  }

  return result;
}

function emaNullable(values: Array<number | null>, period: number): Array<number | null> {
  const result: Array<number | null> = Array(values.length).fill(null);
  const multiplier = 2 / (period + 1);
  const seedValues: number[] = [];
  let previous: number | null = null;

  values.forEach((value, index) => {
    if (value === null) {
      return;
    }

    if (previous === null) {
      seedValues.push(value);
      if (seedValues.length === period) {
        previous = seedValues.reduce((sum, item) => sum + item, 0) / period;
        result[index] = previous;
      }
      return;
    }

    previous = ((value - previous) * multiplier) + previous;
    result[index] = previous;
  });

  return result;
}

function roundTo(value: number, digits: number) {
  return Number(value.toFixed(digits));
}

function lastValue(points: Array<{ value: number }>) {
  return points.length > 0 ? points[points.length - 1].value : null;
}
