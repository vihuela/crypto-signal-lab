import type { Metadata, Viewport } from "next";

import { LocaleProvider } from "@/features/i18n/locale-provider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://crypto-signal-lab.rickyyao.cc"),
  title: {
    default: "Crypto Signal Lab",
    template: "%s | Crypto Signal Lab",
  },
  description:
    "Elegant crypto research dashboard for replaying BTC, ETH, SOL, and DOGE, validating spot strategies, and reading explainable market bias.",
  applicationName: "Crypto Signal Lab",
  keywords: [
    "crypto dashboard",
    "bitcoin replay",
    "strategy backtest",
    "crypto signal",
    "binance data",
    "bybit data",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Crypto Signal Lab",
    description:
      "Replay market structure, inspect strategy bias, and monitor crypto watchlists from a polished local-first research terminal.",
    url: "/",
    siteName: "Crypto Signal Lab",
    locale: "zh_CN",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Crypto Signal Lab dashboard preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crypto Signal Lab",
    description:
      "Replay crypto market structure, compare strategies, and inspect directional bias with a refined research dashboard.",
    images: ["/twitter-image"],
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
