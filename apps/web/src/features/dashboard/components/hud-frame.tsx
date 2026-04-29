import type { CSSProperties, ReactNode } from "react";

type HudFrameProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  accent?: "magenta" | "cyan";
  corners?: boolean;
};

export function HudFrame({
  children,
  className,
  style,
  accent = "magenta",
  corners = true,
}: HudFrameProps) {
  const accentClass = accent === "cyan" ? "hud-frame cyan" : "hud-frame";

  return (
    <div
      className={`${accentClass} relative ${className ?? ""}`.trim()}
      style={style}
    >
      {children}
      {corners ? (
        <>
          <span aria-hidden className="hud-corner tl" />
          <span aria-hidden className="hud-corner tr" />
          <span aria-hidden className="hud-corner bl" />
          <span aria-hidden className="hud-corner br" />
        </>
      ) : null}
    </div>
  );
}
