import { fetchCricinfoAppPageData } from "../lib/scrapers/sites/cricinfo/fetchPageData";

async function main() {
  const { data } = await fetchCricinfoAppPageData(
    "https://www.espncricinfo.com/series/ipl-2025-1449924/mumbai-indians-vs-punjab-kings-qualifier-2-1473510/full-scorecard",
  );
  for (const inn of (data.content as { innings?: { inningNumber?: number; inningOvers?: { balls?: unknown[] }[] }[] })
    .innings ?? []) {
    const overs = inn.inningOvers ?? [];
    const balls = overs.flatMap((o) => o.balls ?? []);
    console.log("inn", inn.inningNumber, "overs", overs.length, "balls", balls.length);
    for (const o of overs) {
      console.log("  over", (o as { overNumber?: number }).overNumber, "balls", (o.balls ?? []).length);
    }
  }
}

main();
