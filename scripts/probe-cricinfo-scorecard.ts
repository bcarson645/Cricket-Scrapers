import { scrapeCricinfoScorecard } from "../lib/scrapers/sites/cricinfo/scrape";

const url =
  "https://www.cricinfo.com/series/ranji-trophy-2026-27-1546521/chhattisgarh-vs-hyderabad-india-elite-group-b-1546585/full-scorecard";

async function main() {
  const { parsed, rows } = await scrapeCricinfoScorecard(url);
  console.log("title", parsed.title);
  console.log("format", parsed.formatLabel, "date", parsed.dateDisplay);
  console.log("innings", parsed.innings.length);
  for (const inn of parsed.innings) {
    console.log(
      " inn",
      inn.inningsNumber,
      inn.teamName,
      "vs",
      inn.opponentName,
      `${inn.total}/${inn.wickets}`,
      "batters",
      inn.batters.length,
      "bowlers",
      inn.bowlers.length,
    );
  }
  console.log("export rows", rows.length);
  console.log("sample batter", rows[0]?.[13], rows[0]?.[15], rows[0]?.[16]);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
