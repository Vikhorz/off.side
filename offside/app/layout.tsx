import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { spaceGrotesk, inter, jetbrainsMono, notoKufiArabic } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Off.side — Football Predictions League",
  description: "The tamper-proof prediction league for your group.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} ${notoKufiArabic.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
