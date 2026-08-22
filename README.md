# Off.side

A prediction league for the matches your group actually watches — Premier League,
Champions League, La Liga, Serie A, Ligue 1, and Bundesliga. Predict scores, use one
boost a week to double your points, and see who calls it best across the season.

## Features

- **Score predictions** on upcoming fixtures across 6 competitions, with a live
  countdown to the next match and a competition filter
- **One boost per calendar week**, freely reassignable between matches until whichever
  one it's on kicks off — then it's locked in
- **Server-validated everything.** Scores, boosts, and prediction deadlines are all
  enforced server-side — nothing is trusted from the client
- **Automatic scoring.** Fixtures and results sync daily from a live football data
  source; points are calculated the moment a match finishes
- **Season history.** Once a competition's season wraps up, each user's points for it
  are archived permanently and stay viewable afterward
- **Live leaderboard** with podium styling for the top 3, and a group activity feed
  showing who's predicted what (without revealing picks before kickoff)
- **Personal stats** — accuracy, points vs. group average, prediction history, and
  earned achievement badges
- **Football news feed** pulled from BBC Sport, with thumbnails
- **Dark/light mode** and full **English / Arabic / Kurdish Sorani** support, including
  proper RTL layout and Arabic-script typography
- **Mobile-first** — bottom tab navigation on small screens, desktop nav above that

## Stack

Next.js (App Router) · NextAuth v5 · Prisma + PostgreSQL (Supabase) · Tailwind CSS v4 ·
SWR · Recharts · next-themes

## How scoring works

| Outcome | Points | With boost |
|---|---|---|
| Exact score | 5 | 10 |
| Correct winner + goal difference | 3 | 6 |
| Correct winner only | 1 | 2 |
| Wrong result | 0 | 0 |

## Environment variables

```
DATABASE_URL            # Postgres connection string (Supabase transaction pooler recommended)
AUTH_SECRET              # generate with: npx auth secret
CRON_SECRET               # any long random string — authenticates the scoring cron
FOOTBALL_DATA_API_KEY      # free key from https://www.football-data.org/client/register
```

## Deploy to Vercel

1. Push this repo to GitHub and import it into Vercel.
2. Create a Postgres database (e.g. [Supabase](https://supabase.com) free tier) and set
   the four environment variables above in the Vercel dashboard.
3. Deploy — `prisma generate` runs automatically via the `postinstall` script.
4. From your local machine, with `DATABASE_URL` pointed at production:
   ```bash
   npx prisma db push
   ```
5. The scoring cron is configured in `vercel.json` (`/api/cron/score`, once daily on the
   Hobby plan). It auto-imports the season's fixtures on first run and keeps results in
   sync after that. To trigger it manually at any time:
   ```bash
   curl "https://your-deployment.vercel.app/api/cron/score" \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

## Local development

```bash
npm install
# create a .env file with the four variables listed above
npx prisma db push
npm run dev
```

## Project structure

```
app/
  login/, register/          — auth pages
  dashboard/                  — predictions view, competition filter, boost logic
  leaderboard/                 — podium + standings
  stats/                        — personal accuracy, points chart, badges
  news/                          — football news feed
  history/                        — archived season standings
  api/
    auth/[...nextauth]/          — NextAuth handler
    register/                     — account creation
    predictions/                   — GET/POST predictions (all validation server-side)
    matches/                        — fixture list + user's own predictions
    leaderboard/, stats/, activity/  — read endpoints for their respective pages
    history/                          — archived season data
    news/                              — BBC Sport RSS proxy
    cron/score/                         — fixture sync, scoring, season archiving
lib/
  auth.ts, prisma.ts, scoring.ts, week.ts, competitions.ts, i18n.tsx, fonts.ts
components/
  Navbar.tsx, MatchCard.tsx, Countdown.tsx, ActivityFeed.tsx, Badges.tsx, and others
middleware.ts                — IP rate limiting on auth endpoints
prisma/schema.prisma          — full DB schema
vercel.json                    — cron schedule
```
