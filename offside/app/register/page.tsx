"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, email: email || undefined }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Registration failed");
    } else {
      router.push("/login");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-grotesk text-3xl font-bold text-warm">
            Off<span className="text-indigo">.</span>side
          </h1>
          <p className="text-xs text-steel mt-2 uppercase tracking-wide">Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div>
            <label className="text-xs text-steel block mb-1">Username</label>
            <input
              value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} maxLength={20}
              className="w-full bg-navy border border-border rounded-md px-3 py-2 text-sm text-warm outline-none focus:border-indigo"
            />
          </div>
          <div>
            <label className="text-xs text-steel block mb-1">Password</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="w-full bg-navy border border-border rounded-md px-3 py-2 text-sm text-warm outline-none focus:border-indigo"
            />
          </div>
          <div>
            <label className="text-xs text-steel block mb-1">Email (optional)</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-navy border border-border rounded-md px-3 py-2 text-sm text-warm outline-none focus:border-indigo"
              placeholder="For password recovery"
            />
            {!email && (
              <p className="text-[10px] text-coral-mid mt-1">
                No recovery possible without an email — you'll be locked out if you forget your password.
              </p>
            )}
          </div>
          {error && <p className="text-xs text-coral-mid">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full bg-indigo text-white text-sm font-medium py-2 rounded-md hover:bg-indigo/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="text-center text-xs text-steel mt-4">
          Already have an account? <Link href="/login" className="text-indigo-mid">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
