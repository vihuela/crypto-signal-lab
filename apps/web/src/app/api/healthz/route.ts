import { NextResponse } from "next/server";

const BACKEND_API_BASE_URL =
  process.env.CSL_API_BASE_URL ?? "http://127.0.0.1:8000";

export const dynamic = "force-dynamic";

export async function GET() {
  const backendUrl = new URL("/healthz", BACKEND_API_BASE_URL);

  try {
    const response = await fetch(backendUrl, {
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          status: "degraded",
          backend_status: response.status,
        },
        {
          status: 503,
          headers: {
            "cache-control": "no-store",
          },
        }
      );
    }

    return NextResponse.json(
      {
        status: "ok",
        backend_status: response.status,
        checked_at: new Date().toISOString(),
      },
      {
        headers: {
          "cache-control": "no-store",
        },
      }
    );
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        backend_status: 0,
        checked_at: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          "cache-control": "no-store",
        },
      }
    );
  }
}
