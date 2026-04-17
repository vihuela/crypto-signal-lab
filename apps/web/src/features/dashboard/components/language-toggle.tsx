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
    <div className="p-1 text-sm">
      <div className="mb-1 px-2 pt-1 text-[0.64rem] uppercase tracking-[0.24em] text-white/36">
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
