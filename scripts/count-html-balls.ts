import { fetchCricinfoScorecardHtml } from "../lib/scrapers/sites/cricinfo/fetchPageData";

async function main() {
  const h = await fetchCricinfoScorecardHtml(
    "https://www.espncricinfo.com/series/ipl-2025-1449924/mumbai-indians-vs-punjab-kings-qualifier-2-1473510/full-scorecard",
  );
  console.log("html len", h.length);
  console.log("oversActual count", (h.match(/oversActual/g) ?? []).length);
  console.log("totalInningRuns count", (h.match(/totalInningRuns/g) ?? []).length);
}

main();
