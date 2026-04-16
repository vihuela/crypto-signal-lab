import { ChevronDown } from "lucide-react";

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
};

export function ControlSelect({
  label,
  value,
  options,
  onChange,
}: ControlSelectProps) {
  return (
    <label className="rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/88 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-sm">
      <span className="mb-2 block text-[0.68rem] uppercase tracking-[0.24em] text-white/38">
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none bg-transparent pr-8 font-medium tracking-[0.03em] text-white/92 outline-none"
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="bg-[#101113] text-white"
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-white/38" />
      </div>
    </label>
  );
}
