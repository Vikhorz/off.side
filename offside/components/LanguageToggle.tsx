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

  const current = options.find((o) => o.code === lang) ?? options[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-[11px] font-medium px-2 py-1.5 rounded-md text-steel hover:text-warm hover:bg-card transition-colors"
        aria-label="Change language"
      >
        {current.label}
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
