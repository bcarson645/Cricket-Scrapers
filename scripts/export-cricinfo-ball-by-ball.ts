import fs from "fs";
import path from "path";
import { cricinfoBallByBallToTsv, fetchCricinfoBallByBall } from "@/lib/ballbyball/fetchCricinfoBallByBall";

const DEFAULT_URL =
  "https://www.espncricinfo.com/series/ipl-2025-1449924/mumbai-indians-vs-punjab-kings-qualifier-2-1473510/full-scorecard";

async function main() {
  const scorecardUrl = process.argv[2] ?? DEFAULT_URL;
  const result = await fetchCricinfoBallByBall(scorecardUrl);

  if (result.warning) {
    console.warn(`Warning: ${result.warning}`);
  }

  const outDir = path.join(process.cwd(), "output");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `ball-by-ball-${result.matchId}.tsv`);
  fs.writeFileSync(outPath, cricinfoBallByBallToTsv(result.rows), "utf8");

  console.log("Source", result.source);
  console.log("Wrote", outPath);
  console.log("Rows", result.rowCount, "by innings", result.byInnings);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
