import { discoverCricbuzzSeriesMatches } from "../lib/scrapers/sites/cricbuzz/discoverSeries";
import { fetchCricbuzzHtml } from "../lib/scrapers/sites/cricbuzz/scrape";

async function main() {
  const url =
    process.argv[2] ??
    "https://www.cricbuzz.com/cricket-series/11408/county-championship-division-one-2026/matches";
  const result = await discoverCricbuzzSeriesMatches(url, fetchCricbuzzHtml);
  console.log("url", result.seriesUrl);
  console.log("title", result.seriesTitle);
  console.log("matches", result.matches.length);
  console.log(result.matches.slice(0, 5));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
