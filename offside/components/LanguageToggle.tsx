"use client";
import { useState, useRef, useEffect } from "react";
import { useI18n, Lang } from "@/lib/i18n";

const options: { code: Lang; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "ar", label: "عربي" },
  { code: "ckb", label: "کوردی" },
];

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-7 h-7 flex items-center justify-center rounded-md text-steel hover:text-warm hover:bg-card transition-colors"
        aria-label="Change language"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
        </svg>
      </button>
      {open && (
        <div className="absolute end-0 top-full mt-1 bg-card border border-border rounded-md py-1 z-50 min-w-[100px] shadow-lg">
          {options.map((o) => (
            <button
              key={o.code}
              onClick={() => { setLang(o.code); setOpen(false); }}
              className={`w-full text-start px-3 py-1.5 text-xs transition-colors ${
                o.code === lang ? "text-indigo-mid bg-indigo-bg" : "text-steel hover:text-warm"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
