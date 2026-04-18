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
      className="p-1 text-sm"
      style={{ color: "var(--theme-copy)" }}
      data-theme={theme.id}
    >
      <div
        className="mb-1 px-2 pt-1 text-[0.64rem] uppercase tracking-[0.24em]"
        style={{ color: "var(--theme-copy-faint)" }}
      >
        {label}
      </div>
      <div className="flex gap-1">
        {(["zh", "en"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className="rounded-full border px-3 py-1.5 transition duration-200 ease-out"
            style={
              locale === item
                ? {
                    background: "var(--theme-chip-active)",
                    borderColor: "var(--theme-chip-active-border)",
                    color: "var(--theme-copy-strong)",
                    boxShadow: "var(--theme-shadow)",
                  }
                : {
                    background: "var(--theme-chip)",
                    borderColor: "var(--theme-chip-border)",
                    color: "var(--theme-copy)",
                  }
            }
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
