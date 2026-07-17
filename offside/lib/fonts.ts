import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";

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
