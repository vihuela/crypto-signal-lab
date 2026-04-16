import { ImageResponse } from "next/og";

export const alt = "Crypto Signal Lab";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(circle at top left, #22c55e 0%, rgba(34, 197, 94, 0.08) 26%), linear-gradient(135deg, #08101f 0%, #13213b 55%, #1f3158 100%)",
          color: "#f8fafc",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            borderRadius: "32px",
            border: "1px solid rgba(148, 163, 184, 0.22)",
            background: "rgba(8, 16, 31, 0.72)",
            padding: "48px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                width: "220px",
                borderRadius: "999px",
                border: "1px solid rgba(148, 163, 184, 0.3)",
                padding: "12px 18px",
                fontSize: "24px",
                color: "#cbd5e1",
              }}
            >
              Crypto Signal Lab
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "76px",
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: "-0.04em",
                maxWidth: "780px",
              }}
            >
              Elegant replay and strategy research for crypto spot markets.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "18px",
                color: "#cbd5e1",
                fontSize: "26px",
              }}
            >
              <span>BTC</span>
              <span>ETH</span>
              <span>SOL</span>
              <span>DOGE</span>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "26px",
                color: "#93c5fd",
              }}
            >
              binance-spot · bybit-spot
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
