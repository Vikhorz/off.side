"use client";
import Link from "next/link";
import { Countdown } from "./Countdown";
import { LanguageToggle } from "./LanguageToggle";
import { useI18n } from "@/lib/i18n";

export function LandingContent({ nextMatch }: {
  nextMatch: { homeTeam: string; awayTeam: string; kickoff: string } | null;
}) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative">
      <div className="absolute top-4 end-4">
        <LanguageToggle />
      </div>
      <div className="w-full max-w-sm text-center">
        <h1 className="font-grotesk text-5xl font-bold text-warm tracking-tight">
          Off<span className="text-indigo">.</span>side
        </h1>
        <p className="text-xs text-steel mt-3 uppercase tracking-wide">{t("landing.tagline")}</p>

        {nextMatch && (
          <div className="mt-8">
            <Countdown
              target={nextMatch.kickoff}
              label={`${t("landing.next")}: ${nextMatch.homeTeam} vs ${nextMatch.awayTeam}`}
            />
          </div>
        )}

        <div className="mt-8 grid grid-cols-3 gap-2 text-left">
          <div className="bg-card border border-border rounded-xl p-3">
            <div className="text-lg mb-1">🎯</div>
            <div className="text-[11px] text-warm font-medium leading-tight">{t("landing.feature1")}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-3">
            <div className="text-lg mb-1">⚡</div>
            <div className="text-[11px] text-warm font-medium leading-tight">{t("landing.feature2")}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-3">
            <div className="text-lg mb-1">🛡️</div>
            <div className="text-[11px] text-warm font-medium leading-tight">{t("landing.feature3")}</div>
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <Link
            href="/register"
            className="block w-full bg-indigo text-white text-sm font-medium py-2.5 rounded-md hover:bg-indigo/90 transition-colors"
          >
            {t("landing.join")}
          </Link>
          <Link
            href="/login"
            className="block w-full text-steel text-sm py-2.5 hover:text-warm transition-colors"
          >
            {t("landing.haveAccount")}
          </Link>
        </div>
      </div>
    </div>
  );
}
