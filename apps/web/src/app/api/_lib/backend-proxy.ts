import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_BASE_URL =
  process.env.CSL_API_BASE_URL ?? "http://127.0.0.1:8000";

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

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type":
          response.headers.get("content-type") ?? "application/json; charset=utf-8",
      },
    });
  } catch {
    return NextResponse.json(
      {
        detail:
          "Unable to reach the local API service. Make sure the FastAPI server is running on port 8000.",
      },
      { status: 502 }
    );
  }
}
