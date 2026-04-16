import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_BASE_URL =
  process.env.CSL_API_BASE_URL ?? "http://127.0.0.1:8000";

const CACHE_CONTROL_BY_PATH: Record<string, string> = {
  "/api/v1/market/watchlist": "public, s-maxage=30, stale-while-revalidate=120",
  "/api/v1/market/replay": "public, s-maxage=60, stale-while-revalidate=300",
  "/api/v1/market/leaderboard": "public, s-maxage=60, stale-while-revalidate=300",
};

export async function proxyBackendGet(request: NextRequest, path: string) {
  const url = new URL(path, BACKEND_API_BASE_URL);

  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  try {
    const response = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
    });

    const body = await response.text();
    const headers = new Headers();
    headers.set(
      "content-type",
      response.headers.get("content-type") ?? "application/json; charset=utf-8"
    );

    const cacheControl = CACHE_CONTROL_BY_PATH[path];
    if (response.ok && cacheControl) {
      headers.set("cache-control", cacheControl);
      headers.set("cdn-cache-control", cacheControl);
    } else {
      headers.set("cache-control", "no-store");
    }

    return new NextResponse(body, {
      status: response.status,
      headers,
    });
  } catch {
    return NextResponse.json(
      {
        detail: "Upstream market service is unavailable.",
      },
      {
        status: 502,
        headers: {
          "cache-control": "no-store",
        },
      }
    );
  }
}
