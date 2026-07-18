import { Space_Grotesk, Inter, JetBrains_Mono, Noto_Kufi_Arabic } from "next/font/google";

// Self-hosted via next/font: no external request at runtime, no render-blocking,
// only the weights actually used are shipped (was loading 12 weight files before).
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-face",
  display: "swap",
});

// Covers both Arabic and Kurdish Sorani (Perso-Arabic script) — used for both
// body text and headings when the site is in RTL mode, since Space Grotesk/Inter
// have no Arabic glyphs at all and would silently fall back to a system font.
export const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});
