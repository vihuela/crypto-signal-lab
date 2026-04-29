import { ChevronDown } from "lucide-react";
import type { DashboardTheme } from "@/features/dashboard/themes/types";

type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type ControlSelectProps = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  theme: DashboardTheme;
};

export function ControlSelect({
  label,
  value,
  options,
  onChange,
  theme,
}: ControlSelectProps) {
  return (
    <label
      className="cyber-clip border px-4 py-3 text-sm backdrop-blur-sm transition-colors duration-150 ease-out hover:border-[color:var(--theme-control-active-border)]"
      style={{
        borderColor: "var(--theme-control-border)",
        background: "var(--theme-control)",
        color: "var(--theme-copy-strong)",
        boxShadow: "var(--theme-shadow)",
      }}
      data-theme={theme.id}
    >
      <span
        className="mb-2 block font-mono-data text-[0.62rem] uppercase tracking-[0.22em] neon-text-cyan"
      >
        {`> ${label}`}
      </span>
      <div className="relative flex items-center">
        <span
          aria-hidden
          className="font-mono-data text-[0.95rem] mr-1.5 select-none"
          style={{ color: "var(--theme-accent)" }}
        >
          ▸
        </span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="font-mono-data w-full appearance-none bg-transparent pr-8 font-medium tracking-[0.04em] outline-none"
          style={{ color: "var(--theme-copy-strong)" }}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              style={{
                background: "var(--theme-panel-strong)",
                color: "var(--theme-copy-strong)",
              }}
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2"
          style={{
            color: "var(--theme-accent-2)",
            filter: "drop-shadow(0 0 4px rgba(0,240,255,0.7))",
          }}
        />
      </div>
    </label>
  );
}
