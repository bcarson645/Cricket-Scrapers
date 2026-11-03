import fs from "fs";
import path from "path";
import { rowsToCsv } from "@/lib/scorecards/toCsv";
import { scrapeNvplayEcbScorecard } from "@/lib/scrapers/sites/nvplay-ecb/scrape";

const DEFAULT =
  "https://live.nvplay.com/ecb/?tab=m_scorecard#mc5520000-6664-a623-2334-08de2d98b6d4";

async function main() {
  const url = process.argv[2] ?? DEFAULT;
  const { parsed, rows, fetchedFrom } = await scrapeNvplayEcbScorecard(url);
  const outDir = path.join(process.cwd(), "output");
  fs.mkdirSync(outDir, { recursive: true });
  const safeId = parsed.cricbuzzMatchId.replace(/[^a-z0-9-]/gi, "_");
  const outPath = path.join(outDir, `nvplay-ecb-scorecard-${safeId}.csv`);
  fs.writeFileSync(outPath, rowsToCsv(rows), "utf8");
  console.log("Fetched", fetchedFrom);
  console.log("Innings", parsed.innings.length, "Export rows", rows.length);
  console.log("Wrote", outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
