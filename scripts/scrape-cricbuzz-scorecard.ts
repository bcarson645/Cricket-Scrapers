import fs from "fs";
import path from "path";
import { parseCricbuzzScorecardHtml } from "../lib/scrapers/sites/cricbuzz/parseHtml";
import { cricbuzzToExportRows } from "../lib/scrapers/sites/cricbuzz/buildExportRows";
import { applyMappingRegistry } from "../lib/mappings/apply";
import { loadMappingRegistry } from "../lib/mappings/load";
import { rowsToCsv } from "../lib/scorecards/toCsv";

async function main() {
  const urlOrId = process.argv[2];
  const outArg = process.argv.indexOf("-o");
  const outPath = outArg >= 0 ? process.argv[outArg + 1] : null;
  const goldenId = process.argv.includes("--id")
    ? process.argv[process.argv.indexOf("--id") + 1]
    : undefined;

  if (!urlOrId) {
    console.error(
      "Usage: npm run scrape:cricbuzz -- <url-or-match-id> [-o out.csv] [--id internalMatchId]",
    );
    process.exit(1);
  }

  const { scrapeCricbuzzScorecard } = await import("../lib/scrapers/sites/cricbuzz/scrape");
  const { rows } = await scrapeCricbuzzScorecard(urlOrId, {
    matchIdOverride: goldenId,
  });
  const csv = rowsToCsv(rows);

  if (outPath) {
    const resolved = path.resolve(outPath);
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, csv, "utf8");
    console.log(`Wrote ${rows.length} rows to ${resolved}`);
  } else {
    process.stdout.write(csv);
  }
}

// allow offline test: npm run scrape:cricbuzz -- --fixture fixtures/cricbuzz-139489.html
async function run() {
  if (process.argv[2] === "--fixture") {
    const fixturePath = process.argv[3] ?? "fixtures/cricbuzz-139489.html";
    const goldenId = process.argv.includes("--id")
      ? process.argv[process.argv.indexOf("--id") + 1]
      : undefined;
    const html = fs.readFileSync(fixturePath, "utf8");
    const matchId = path.basename(fixturePath).match(/cricbuzz-(\d+)/)?.[1] ?? "139489";
    const parsed = parseCricbuzzScorecardHtml(html, matchId);
    let rows = cricbuzzToExportRows(parsed, { matchIdOverride: goldenId });
    rows = applyMappingRegistry(rows, parsed, loadMappingRegistry(), {
      matchIdOverride: goldenId,
    });
    const out = process.argv.includes("-o") ? process.argv[process.argv.indexOf("-o") + 1] : null;
    const csv = rowsToCsv(rows);
    if (out) fs.writeFileSync(out, csv);
    else process.stdout.write(csv);
    console.error(`Parsed ${rows.length} rows from ${fixturePath}`);
    return;
  }
  await main();
}

run().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
