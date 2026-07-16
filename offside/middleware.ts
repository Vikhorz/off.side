import { NextRequest, NextResponse } from "next/server";

// In-memory rate limit store (fine for a friend-group app on a single Vercel instance region;
// swap for Vercel KV / Upstash if you scale beyond that).
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/auth/callback/credentials") || req.nextUrl.pathname === "/api/register") {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const now = Date.now();
    const entry = attempts.get(ip);

    if (!entry || now > entry.resetAt) {
      attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    } else {
      entry.count++;
      if (entry.count > MAX_ATTEMPTS) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        return NextResponse.json(
          { error: "Too many attempts. Try again shortly." },
          { status: 429, headers: { "Retry-After": String(retryAfter) } }
        );
      }
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/api/auth/callback/credentials", "/api/register"] };
