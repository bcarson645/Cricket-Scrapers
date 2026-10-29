import { fetchCricbuzzHtml } from "../lib/scrapers/sites/cricbuzz/scrape";
import { parseCricbuzzScorecardHtml } from "../lib/scrapers/sites/cricbuzz/parseHtml";
import { cricbuzzToExportRows } from "../lib/scrapers/sites/cricbuzz/buildExportRows";

async function main() {
  const id = process.argv[2] ?? "142030";
  const html = await fetchCricbuzzHtml(`https://www.cricbuzz.com/live-cricket-scorecard/${id}`);
  const parsed = parseCricbuzzScorecardHtml(html, id);
  for (const inn of parsed.innings) {
    console.log(
      "matchInn",
      inn.inningsNumber,
      "teamInn",
      inn.teamBattingInningsIndex,
      inn.teamName,
      "vs",
      inn.opponentName,
    );
  }
  const rows = cricbuzzToExportRows(parsed);
  for (const inn of parsed.innings) {
    const r = rows.find((row) => row[12] === 1 && row[6] === inn.teamName);
    if (r) console.log("export", r[6], r[7], "Inns", r[8], r[13]);
  }
}

main().catch(console.error);
