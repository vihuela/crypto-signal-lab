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
      className="rounded-[1.4rem] border px-4 py-3 text-sm backdrop-blur-sm"
      style={{
        borderColor: "var(--theme-control-border)",
        background: "var(--theme-control)",
        color: "var(--theme-copy-strong)",
        boxShadow: "var(--theme-shadow)",
      }}
      data-theme={theme.id}
    >
      <span
        className="mb-2 block text-[0.68rem] uppercase tracking-[0.24em]"
        style={{ color: "var(--theme-copy-faint)" }}
      >
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none bg-transparent pr-8 font-medium tracking-[0.03em] outline-none"
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
          style={{ color: "var(--theme-copy-faint)" }}
        />
      </div>
    </label>
  );
}
