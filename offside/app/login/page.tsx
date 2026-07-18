"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { username, password, redirect: false });
    setLoading(false);
    if (res?.error) setError(t("auth.invalidLogin"));
    else router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-grotesk text-3xl font-bold text-warm">
            Off<span className="text-indigo">.</span>side
          </h1>
          <p className="text-xs text-steel mt-2 uppercase tracking-wide">{t("landing.tagline")}</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div>
            <label className="text-xs text-steel block mb-1">{t("auth.username")}</label>
            <input
              value={username} onChange={(e) => setUsername(e.target.value)} required
              className="w-full bg-navy border border-border rounded-md px-3 py-2 text-base sm:text-sm text-warm outline-none focus:border-indigo"
            />
          </div>
          <div>
            <label className="text-xs text-steel block mb-1">{t("auth.password")}</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full bg-navy border border-border rounded-md px-3 py-2 text-base sm:text-sm text-warm outline-none focus:border-indigo"
            />
          </div>
          {error && <p className="text-xs text-coral-mid">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full bg-indigo text-white text-sm font-medium py-2 rounded-md hover:bg-indigo/90 disabled:opacity-50 transition-colors"
          >
            {loading ? t("auth.signingin") : t("auth.signin")}
          </button>
        </form>
        <p className="text-center text-xs text-steel mt-4">
          {t("auth.noAccount")} <Link href="/register" className="text-indigo-mid">{t("auth.register")}</Link>
        </p>
      </div>
    </div>
  );
}
