import { env as workerEnv } from "cloudflare:workers";
import { Container } from "@cloudflare/containers";

const DEFAULT_INSTANCE_NAME = "crypto-signal-lab-api";
const BLOCKED_PUBLIC_PATHS = new Set(["/docs", "/redoc", "/openapi.json"]);

export class CryptoSignalLabApiContainer extends Container {
  defaultPort = 8000;
  pingEndpoint = "container/healthz";
  sleepAfter = "10m";
  envVars = {
    CSL_FRED_API_KEY: workerEnv.CSL_FRED_API_KEY ?? "",
    CSL_GLASSNODE_API_KEY: workerEnv.CSL_GLASSNODE_API_KEY ?? "",
    CSL_SOSOVALUE_API_KEY: workerEnv.CSL_SOSOVALUE_API_KEY ?? "",
  };

  async fetch(request) {
    await this.startAndWaitForPorts({
      ports: this.defaultPort,
      cancellationOptions: {
        abort: request.signal,
        instanceGetTimeoutMS: 20_000,
        portReadyTimeoutMS: 20_000,
        waitInterval: 500,
      },
    });

    return super.fetch(request);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (BLOCKED_PUBLIC_PATHS.has(url.pathname)) {
      return new Response("Not found", {
        status: 404,
        headers: {
          "cache-control": "no-store",
        },
      });
    }

    if (request.method === "GET" && url.pathname === "/") {
      return Response.json(
        {
          name: "Crypto Signal Lab API",
          status: "ok",
        },
        {
          headers: {
            "cache-control": "no-store",
          },
        }
      );
    }

    const instanceName =
      env.API_CONTAINER_INSTANCE_NAME ?? DEFAULT_INSTANCE_NAME;
    const stub = env.API_CONTAINER.getByName(instanceName);
    return stub.fetch(request);
  },
};
