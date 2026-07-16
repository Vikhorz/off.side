import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy:   "#0F1B2D",
        indigo: { DEFAULT: "#5B6EF5", mid: "#8B9CF7", bg: "#1C2547", border: "#2E3F7A" },
        coral:  { DEFAULT: "#F04E37", mid: "#F47A6A", bg: "#2D1A18" },
        steel:  "#8A9BAB",
        warm:   "#F5F4F1",
        card:   "#162030",
        border: "#1E2F42",
      },
      fontFamily: {
        grotesk: ["Space Grotesk", "sans-serif"],
        sans:    ["Inter", "sans-serif"],
        mono:    ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
