import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Off.side | World Cup Prediction League",
  description:
    "World Cup 2026 prediction league with server-side scoring, boosts, and leaderboards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
