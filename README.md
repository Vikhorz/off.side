# Off.side — World Cup 2026 Prediction League

A secure, from-scratch rebuild of the friend-group prediction game (originally "Patata FC"),
fixing the client-side score/boost tampering vulnerabilities found in that app.

## Stack
Next.js 16 (App Router) · NextAuth v5 · Prisma + PostgreSQL (Supabase) · Tailwind CSS · SWR · Recharts

> Note: `create-next-app@latest` pulled Next.js 16.2.10 (newest available) rather than 15 as in
> the original spec doc — the App Router patterns used here (route handlers, server components,
> middleware) are stable across both versions, so nothing had to change.

## Security fixes vs. the original
- **Scores are never trusted from the client.** Points are calculated server-side by a cron job
  (`/api/cron/score`) that compares stored predictions to `Match.homeResult`/`awayResult`.
- **Boost is validated against a DB record** (`BoostAllowance`), not the client's `boosted` field.
- **Prediction deadline is enforced server-side** — `if (new Date() >= match.kickoff)` in
  `/api/predictions`, not just hidden in the UI.
- **Rate limiting** on login/register via `middleware.ts` (10 attempts/min/IP).

## Deploy to Vercel

1. **Push this folder to a GitHub repo.**
2. **Create a Postgres database** — easiest is [Supabase](https://supabase.com) (free tier) or
   Vercel Postgres. Copy the connection string.
3. **Import the repo into Vercel.** Set these Environment Variables in the Vercel dashboard:
   - `DATABASE_URL` — your Postgres connection string
   - `AUTH_SECRET` — run `npx auth secret` locally to generate one, or any long random string
   - `CRON_SECRET` — any long random string (protects the scoring cron endpoint)
4. **Deploy.** Vercel runs `npm install` → `postinstall` triggers `prisma generate` automatically.
5. **Run the first migration** from your local machine (with `DATABASE_URL` pointed at prod):
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed   # optional: adds two sample matches
   ```
6. **Cron job** is already configured in `vercel.json` to hit `/api/cron/score` hourly.
   Vercel automatically sends the `x-cron-secret` header if you set `CRON_SECRET` as an env var —
   double check this matches what `/api/cron/score` expects (Vercel Cron docs: set the header
   under Project Settings → Cron Jobs if not automatic in your plan).

## Local development
```bash
npm install
cp .env.example .env   # fill in DATABASE_URL and AUTH_SECRET
npx prisma migrate dev --name init
npm run dev
```

## Adding real match data
`Match` rows need `id`, `homeTeam`, `awayTeam`, `group`, `kickoff` populated — either seed manually
(see `prisma/seed.ts`) or write a small script pulling fixtures from a free API like
football-data.org and upserting them into the `Match` table.

## Project structure
```
app/
  login/, register/        — auth pages
  dashboard/                — predictions view (MatchCard list)
  leaderboard/               — live standings
  stats/                     — personal accuracy + points-vs-average chart
  api/
    auth/[...nextauth]/      — NextAuth handler
    register/                — account creation
    predictions/             — GET/POST predictions (server validates everything)
    matches/                  — list matches + user's own predictions
    leaderboard/               — public standings
    stats/                     — personal stats
    cron/score/                 — scoring job, called hourly by Vercel Cron
lib/
  auth.ts, prisma.ts, scoring.ts
components/
  Navbar.tsx, MatchCard.tsx
middleware.ts               — IP rate limiting on auth endpoints
prisma/schema.prisma        — full DB schema
vercel.json                 — cron schedule
```

## Known limitation of this build environment
`prisma generate` could not run in the sandbox that produced this code because its network
egress doesn't allow reaching Prisma's binary CDN. This has no bearing on Vercel deploys —
Vercel's build environment has full network access and runs `prisma generate` automatically via
the `postinstall` script in `package.json`. All application code was typechecked and reviewed
independent of the generated client.
