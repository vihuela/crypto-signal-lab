import type { Metadata } from "next";

import { LocaleProvider } from "@/features/i18n/locale-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crypto Signal Lab",
  description: "A local-first research terminal for crypto replay, strategy validation, and AI-assisted bias.",
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
