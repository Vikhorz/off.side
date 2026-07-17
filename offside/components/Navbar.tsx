"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { href: "/dashboard", label: "Predict", icon: "target" },
  { href: "/leaderboard", label: "Leaderboard", icon: "trophy" },
  { href: "/stats", label: "My stats", icon: "chart" },
  { href: "/news", label: "News", icon: "news" },
];

function NavIcon({ name }: { name: string }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 } as const;
  switch (name) {
    case "target":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" fill="currentColor" /></svg>;
    case "trophy":
      return <svg {...common}><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 01-10 0V4zM7 6H4a3 3 0 003 3M17 6h3a3 3 0 01-3 3" /></svg>;
    case "chart":
      return <svg {...common}><path d="M4 20V10M12 20V4M20 20v-7" /></svg>;
    case "news":
      return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 8h10M7 12h10M7 16h6" /></svg>;
    default:
      return null;
  }
}

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <>
      {/* Top bar — full nav on desktop, compact on mobile */}
      <nav className="flex items-center justify-between px-4 py-3 border-b border-border bg-navy sticky top-0 z-40">
        <Link href="/dashboard" className="font-grotesk font-bold text-lg text-warm tracking-tight">
          Off<span className="text-indigo">.</span>side
        </Link>
        <div className="flex items-center gap-1">
          {/* Desktop links */}
          <div className="hidden sm:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                  pathname === l.href ? "bg-indigo-bg text-indigo-mid" : "text-steel hover:text-warm"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <ThemeToggle />
          {session && (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs px-2 sm:px-3 py-1.5 rounded-md text-steel hover:text-coral-mid transition-colors ml-1"
            >
              <span className="hidden sm:inline">Sign out</span>
              <svg className="sm:hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          )}
        </div>
      </nav>

      {/* Bottom tab bar — mobile only */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-navy border-t border-border flex items-stretch z-40">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors ${
              pathname === l.href ? "text-indigo-mid" : "text-steel"
            }`}
          >
            <NavIcon name={l.icon} />
            {l.label === "Leaderboard" ? "Board" : l.label === "My stats" ? "Stats" : l.label}
          </Link>
        ))}
      </div>
    </>
  );
}
