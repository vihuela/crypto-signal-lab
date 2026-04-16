import type { Locale } from "@/features/i18n/dictionaries";

type LanguageToggleProps = {
  label: string;
  locale: Locale;
  onChange: (locale: Locale) => void;
};

export function LanguageToggle({
  label,
  locale,
  onChange,
}: LanguageToggleProps) {
  return (
    <div className="rounded-full border border-white/10 bg-white/5 p-1 text-sm shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="mb-1 px-3 pt-2 text-[0.64rem] uppercase tracking-[0.24em] text-white/36">
        {label}
      </div>
      <div className="flex gap-1">
        {(["zh", "en"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`rounded-full px-3 py-1.5 transition ${
              locale === item
                ? "bg-[#f6efe5] text-[#111317]"
                : "text-white/62 hover:bg-white/8"
            }`}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
