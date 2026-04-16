import type {
  ReplayResponse,
  SourceId,
  StrategyId,
  StrategyLeaderboardResponse,
  Timeframe,
  WatchlistItem,
} from "@/features/dashboard/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type ReplayParams = {
  source: SourceId;
  symbol: string;
  timeframe: Timeframe;
  strategy: StrategyId;
  limit?: number;
  signal?: AbortSignal;
};

export async function fetchReplay({
  source,
  symbol,
  timeframe,
  strategy,
  limit = 1000,
  signal,
}: ReplayParams): Promise<ReplayResponse> {
  const url = buildApiUrl("/api/v1/market/replay", {
    source,
    symbol,
    timeframe,
    strategy,
    limit: String(limit),
  });

  const response = await fetch(url, {
    cache: "no-store",
    signal,
  });
  if (!response.ok) {
    const detail = await readErrorMessage(response);
    throw new Error(detail);
  }

  return response.json();
}

export async function fetchWatchlist({
  source,
  timeframe,
  strategy,
  signal,
}: Omit<ReplayParams, "symbol" | "limit">): Promise<WatchlistItem[]> {
  const url = buildApiUrl("/api/v1/market/watchlist", {
    source,
    timeframe,
    strategy,
  });

  const response = await fetch(url, {
    cache: "no-store",
    signal,
  });
  if (!response.ok) {
    const detail = await readErrorMessage(response);
    throw new Error(detail);
  }

  return response.json();
}

export async function fetchStrategyLeaderboard({
  source,
  symbol,
  timeframe,
  limit = 1000,
  signal,
}: Omit<ReplayParams, "strategy">): Promise<StrategyLeaderboardResponse> {
  const url = buildApiUrl("/api/v1/market/leaderboard", {
    source,
    symbol,
    timeframe,
    limit: String(limit),
  });

  const response = await fetch(url, {
    cache: "no-store",
    signal,
  });
  if (!response.ok) {
    const detail = await readErrorMessage(response);
    throw new Error(detail);
  }

  return response.json();
}

async function readErrorMessage(response: Response) {
  try {
    const payload: unknown = await response.json();
    if (payload && typeof payload === "object" && "detail" in payload) {
      const detail = payload.detail;
      if (typeof detail === "string") {
        return detail;
      }
    }

    return `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

function buildApiUrl(path: string, params: Record<string, string>) {
  const search = new URLSearchParams(params).toString();

  if (API_BASE_URL) {
    const url = new URL(path, API_BASE_URL);
    return `${url.toString()}?${search}`;
  }

  return `${path}?${search}`;
}
