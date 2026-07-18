"use client";
import { SessionProvider as NextSessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/lib/i18n";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false}>
      <LanguageProvider>
        <NextSessionProvider>{children}</NextSessionProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
