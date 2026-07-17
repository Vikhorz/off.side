"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { href: "/dashboard", label: "Predict" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/stats", label: "My stats" },
  { href: "/news", label: "News" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="flex items-center justify-between px-4 py-3 border-b border-border bg-navy">
      <Link href="/dashboard" className="font-grotesk font-bold text-lg text-warm tracking-tight">
        Off<span className="text-indigo">.</span>side
      </Link>
      <div className="flex items-center gap-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              pathname === l.href
                ? "bg-indigo-bg text-indigo-mid"
                : "text-steel hover:text-warm"
            }`}
          >
            {l.label}
          </Link>
        ))}
        <ThemeToggle />
        {session && (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs px-3 py-1.5 rounded-md text-steel hover:text-coral-mid transition-colors ml-1"
          >
            Sign out
          </button>
        )}
      </div>
    </nav>
  );
}
