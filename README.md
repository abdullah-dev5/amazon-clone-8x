# amazonw

A from-scratch recreation of the Amazon.com core shopping experience —
discovery through checkout, order tracking, reviews, and account
management — built with Next.js (App Router), TypeScript, Prisma, and
PostgreSQL. Not affiliated with or endorsed by Amazon.com, Inc.

See `PROGRESS.md` (local-only, not part of this repo checkout) for the
full build history and milestone-by-milestone notes if you have it; this
file covers what's needed to run the project.

## Requirements

- Node.js 20+
- A PostgreSQL database (a local instance, or a free branch on
  [Neon](https://neon.tech) — see below)

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in real values:
   ```bash
   cp .env.example .env
   ```
   - `DATABASE_URL` — a PostgreSQL connection string. For local dev, either
     run Postgres yourself (Docker, Postgres.app, a native install) or use
     a Neon development branch.
   - `SESSION_SECRET` — any random string (`node -e
     "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
3. Apply the schema and seed demo data:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

**Demo account**: `demo@example.com` / `password123`

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build locally |
| `npm run lint` | ESLint |
| `npm run db:seed` | Reset and reseed the database with demo data — destructive, local/dev use only |
| `npm run test:e2e` | Playwright end-to-end tests (starts its own dev server if one isn't already running on port 3000) |

## Deployment (Vercel)

This project deploys to Vercel with no custom configuration — it's
auto-detected as a Next.js App Router project. You need:

1. A production PostgreSQL database (Neon recommended, matching the
   `GitHub → Vercel → Next.js → Neon` architecture this was built for).
2. `DATABASE_URL` and `SESSION_SECRET` set as environment variables in the
   Vercel project settings (never committed to the repo).
3. Migrations applied to the production database before or during the
   first deploy: `npx prisma migrate deploy` (never `migrate dev` or
   `db push` against production).
4. Optionally, `npm run db:seed` run once against the production database
   for demo data — do this manually and deliberately; it is destructive
   (drops and recreates all data) and must never run automatically as
   part of a build or deploy.

Vercel's serverless functions run on a read-only, ephemeral filesystem, so
a file-based database (SQLite) cannot reliably persist writes in
production — this is why the project targets Postgres rather than the
SQLite file used earlier in development.
