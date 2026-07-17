"use client";
import { SessionProvider as NextSessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false}>
      <NextSessionProvider>{children}</NextSessionProvider>
    </ThemeProvider>
  );
}
