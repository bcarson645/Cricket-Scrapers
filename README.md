# Cricket scorecard scrapers

Next.js App Router app — same habits as your other cricket tooling: **components render**, **`app/data` builds view models**, **`lib/` holds server plumbing** (SQLite + site scrapers), **`app/api`** for discover/scrape.

## Stack

- Next.js 16 + React 18 + TypeScript 5
- Single `app/globals.css` (no Tailwind)
- **node:sqlite** → `data/scrapers.db` locally, `/tmp` on Vercel via `lib/scrapeDb/`
- Dev: `npm run dev` → `scripts/dev-start.cjs` (frees port 3000, then `next dev --webpack`)

## Commands

```powershell
cd "C:\Users\b.carson\OneDrive - SportradarAG\New folder\Code\Scrapers"
npm install
npm run dev
```

Open http://localhost:3000 — pick site/dates, discover matches, select rows, scrape.

`npm run typecheck` · `npm run build`

## Deploy (Vercel)

Your project dashboard shows **“No Production Deployment”** when the Vercel project exists but **no build has succeeded** yet — usually Git is not connected, or the first deploy never finished (e.g. login/passkey interrupted).

### Connect GitHub and deploy

1. Open [cricket-scrapers on Vercel](https://vercel.com/ben-carsons-projects/cricket-scrapers) → **Settings** → **Git**.
2. If no repo is linked, **Connect Git Repository** → choose **`bcarson645/Cricket-Scrapers`**, production branch **`main`**.
3. **Settings** → **General** → **Node.js Version** → **22.x** (required for `node:sqlite`).
4. **Deployments** → **Redeploy** (or push any commit to `main`).

Build command: `npm run build` · Install: `npm install` · Root directory: `.` (repo root).

1. Push this repo to GitHub (or GitLab/Bitbucket), then [import the project in Vercel](https://vercel.com/new) — framework **Next.js**, Node **22.x**.
2. Or from this folder (after [Vercel CLI login](https://vercel.com/docs/cli)):

```powershell
npx vercel
npx vercel --prod
```

No env vars required for the Cricbuzz QA flow. ID mappings ship from `fixtures/mappings/registry.json`.

**Note:** SQLite on Vercel is ephemeral (`/tmp`); scrape history does not persist across invocations. The Cricbuzz scorecard API and CSV download do not depend on the DB.

Optional: set `maxDuration` above 10s on Hobby may require Pro for API routes that fetch Cricbuzz (see `vercel.json`).

## Folder map

| Path | Role |
|------|------|
| `app/components/` | UI only |
| `app/data/scrapeWorkbench.ts` | Pure discover/view builders |
| `app/api/discover`, `app/api/scrape` | HTTP triggers for a site + period |
| `lib/scrapers/sites/` | One file per source site (`SiteAdapter`) |
| `lib/scrapers/normalize.ts` | Map parser output → export schema (placeholder) |
| `lib/scrapeDb/` | Runs + stored scorecard JSON |

## vs Python-only scrapers

Use this layout when you want **UI selection**, **SQLite history**, and **one repo** with your other apps. Add **cheerio** or **playwright** in `lib/scrapers/sites/<site>.ts` for real HTML. Keep long batch jobs as `scripts/` callers hitting the same `lib/scrapers` code.

Replace `ScorecardDocument` in `lib/scrapers/types.ts` when your export spec arrives.

## Adding a site

1. Implement `SiteAdapter` in `lib/scrapers/sites/<id>.ts` (copy `example.ts`).
2. Register in `lib/scrapers/registry.ts`.

Mock data in `example` is **deterministic** (seeded by match id/date) so reloads stay stable until live parsers land.
