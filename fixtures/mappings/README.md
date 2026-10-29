# ID mapping registry

Links **Cricbuzz** scrape fields to your **internal / Sportradar** export columns. The scraper still parses Cricbuzz HTML as-is; `lib/mappings/apply.ts` overlays IDs when entries exist in `registry.json`.

## Match IDs

Lookup order:

1. CLI / UI `matchIdOverride` (explicit internal id)
2. `cricbuzzMatchId` on a `matches[]` row
3. `date` + two `teams` (order-independent key, same as export `Date` + `Team`/`Opps`)

After a confirmed scrape, add or update a `matches` row so future runs (and other tools) can resolve the same fixture without manual `--id`.

## Player IDs

Lookup order:

1. `cricbuzzPlayerId` (stable across games — preferred for learning)
2. `exportName` / `aliases` vs Cricbuzz display name

Grow `players[]` from your bulk reference file or by merging **unmapped** hints from QA (see `listUnmappedPlayers` in `lib/mappings/resolve.ts`).

## Files

| File | Purpose |
|------|---------|
| `registry.json` | Current mappings (safe to commit seeds; bulk import can replace or merge) |

Later: import script from Excel/CSV, SQLite table for edits in-app, and “save Cricbuzz id ↔ internal id” from the scorecard QA screen.
