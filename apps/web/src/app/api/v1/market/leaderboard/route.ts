import { NextRequest } from "next/server";

import { proxyBackendGet } from "@/app/api/_lib/backend-proxy";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  return proxyBackendGet(request, "/api/v1/market/leaderboard");
}
