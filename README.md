# Off.side

World Cup 2026 prediction league app.

## Run

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

## What This Implements

- Next.js App Router application.
- Server action for saving predictions.
- Server-side kickoff deadline validation.
- Boost validation derived from server state, not trusted client input.
- Server-only scoring helpers for exact score, goal difference, winner, and boost multipliers.
- Prisma schema for `User`, `Match`, `Prediction`, and `BoostAllowance`.
- Cron route scaffold for post-result scoring.

The UI currently uses a demo server store so the app runs immediately. Swap the
repository functions in `src/lib/demo-store.ts` for Prisma calls when Supabase is
connected, then add `prisma`, `@prisma/client`, and `next-auth` dependencies for
the production auth/database layer.
