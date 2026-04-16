import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Crypto Signal Lab",
    short_name: "Signal Lab",
    description:
      "Replay crypto market structure, compare strategies, and inspect explainable bias across curated spot pairs.",
    start_url: "/",
    display: "standalone",
    background_color: "#08101f",
    theme_color: "#0b1220",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}
