import fs from "fs";
import { fetchCricinfoAppPageData } from "../lib/scrapers/sites/cricinfo/fetchPageData";

const url =
  "https://www.espncricinfo.com/series/ipl-2025-1449924/mumbai-indians-vs-punjab-kings-qualifier-2-1473510/full-scorecard";

async function main() {
  const { data } = await fetchCricinfoAppPageData(url);
  const innings = (data.content as { innings?: Record<string, unknown>[] }).innings ?? [];
  for (const inn of innings) {
    console.log("inning", inn.inningNumber, "runs", inn.runs, "keys", Object.keys(inn).slice(0, 25));
    const overs = inn.inningOvers as unknown[] | undefined;
    const balls = inn.balls as unknown[] | undefined;
    const recent = inn.recentOvers as unknown[] | undefined;
    if (overs) console.log("  inningOvers", overs.length);
    if (balls) console.log("  balls", balls.length);
    if (recent) console.log("  recentOvers", recent.length);
  }
  const players = (data.content as { matchPlayers?: Record<string, unknown>[] }).matchPlayers ?? [];
  console.log("matchPlayers", players.length, players[0] ? Object.keys(players[0]) : []);
  fs.writeFileSync("tmp-innings-sample.json", JSON.stringify(innings[0], null, 2).slice(0, 8000));
}

main();
