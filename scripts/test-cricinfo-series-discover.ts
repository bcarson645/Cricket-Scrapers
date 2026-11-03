import { discoverCricinfoSeriesMatches } from "@/lib/scrapers/sites/cricinfo/discoverSeries";

async function main() {
  const url =
    process.argv[2] ??
    "https://www.cricinfo.com/series/ireland-in-namibia-2026-27-1558225/match-schedule-fixtures-and-results";
  const result = await discoverCricinfoSeriesMatches(url);
  console.log("series", result.seriesTitle, result.seriesUrl);
  for (const m of result.matches) {
    console.log(m.matchDate, m.matchId, m.title.slice(0, 80));
    console.log(" ", m.url);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
