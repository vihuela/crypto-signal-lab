"use client";

import { useEffect, useRef } from "react";

import cryptoLogoAnimation from "../../../../public/animations/crypto-logo.json";
import type { DashboardTheme } from "@/features/dashboard/themes/types";
import type { Locale } from "@/features/i18n/dictionaries";

type CryptoLogoLottieProps = {
  locale: Locale;
  theme: DashboardTheme;
  compact?: boolean;
};

export function CryptoLogoLottie({
  locale,
  theme,
  compact = false,
}: CryptoLogoLottieProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    async function mountAnimation() {
      if (!containerRef.current) {
        return;
      }

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      const { default: lottie } = await import("lottie-web");

      if (cancelled || !containerRef.current) {
        return;
      }

      const animationData =
        typeof structuredClone === "function"
          ? structuredClone(cryptoLogoAnimation)
          : JSON.parse(JSON.stringify(cryptoLogoAnimation));

      const animation = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: !prefersReducedMotion,
        autoplay: !prefersReducedMotion,
        animationData,
        rendererSettings: {
          preserveAspectRatio: "xMidYMid meet",
        },
      });

      animation.setSpeed(0.9);

      if (prefersReducedMotion) {
        animation.addEventListener("DOMLoaded", () => {
          animation.goToAndStop(0, true);
        });
      }

      cleanup = () => {
        animation.destroy();
      };
    }

    void mountAnimation();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <div
      className={compact ? "relative h-[88px] w-[200px] md:h-[96px] md:w-[224px]" : "relative h-[220px] w-full md:h-[250px]"}
      style={{
        filter: compact
          ? "drop-shadow(0 0 22px var(--theme-focus))"
          : "drop-shadow(0 0 30px var(--theme-focus))",
      }}
      data-theme={theme.id}
      aria-label={
        locale === "zh"
          ? "BTC ETH SOL DOGE 字样循环动画"
          : "BTC ETH SOL DOGE looping wordmark animation"
      }
    >
      <div
        ref={containerRef}
        aria-hidden="true"
        className="h-full w-full"
      />
    </div>
  );
}
