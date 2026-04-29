import type { Locale } from "@/features/i18n/dictionaries";
import type { DashboardTheme } from "@/features/dashboard/themes/types";

type LanguageToggleProps = {
  label: string;
  locale: Locale;
  onChange: (locale: Locale) => void;
  theme: DashboardTheme;
};

export function LanguageToggle({
  label,
  locale,
  onChange,
  theme,
}: LanguageToggleProps) {
  return (
    <div
      className="p-1 text-sm font-mono-data"
      style={{ color: "var(--theme-copy)" }}
      data-theme={theme.id}
    >
      <div
        className="mb-1 px-2 pt-1 text-[0.6rem] uppercase tracking-[0.24em] neon-text-cyan"
      >
        {`> ${label}`}
      </div>
      <div
        className="flex gap-0 cyber-clip border"
        style={{
          borderColor: "var(--theme-control-border)",
          background: "var(--theme-control)",
        }}
      >
        {(["zh", "en"] as const).map((item, idx) => {
          const isActive = locale === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              className="px-3.5 py-1.5 transition-colors duration-150 ease-out"
              style={{
                color: isActive
                  ? "var(--theme-accent)"
                  : "var(--theme-copy)",
                background: isActive
                  ? "color-mix(in srgb, var(--theme-accent) 14%, transparent)"
                  : "transparent",
                textShadow: isActive
                  ? "0 0 8px rgba(255,43,214,0.7)"
                  : "none",
                borderLeft:
                  idx === 0
                    ? "none"
                    : "1px solid var(--theme-control-border)",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {item.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
