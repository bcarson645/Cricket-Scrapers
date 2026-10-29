import { writeFileSync } from "fs";
import { fetchCricbuzzHtml } from "../lib/scrapers/sites/cricbuzz/scrape";

async function main() {
  const url =
    "https://www.cricbuzz.com/cricket-series/11408/county-championship-division-one-2026/matches";
  const html = await fetchCricbuzzHtml(url);
  const idx = html.toLowerCase().indexOf("division one");
  console.log("division one at", idx);
  if (idx > 0) console.log(html.slice(idx - 200, idx + 800));

  const series11408 = [...html.matchAll(/11408/g)].length;
  console.log("11408 occurrences", series11408);

  const m = html.match(/seriesMatches[\s\S]{0,500}/i);
  console.log("seriesMatches snippet", m?.[0]?.slice(0, 400));

  writeFileSync("tmp-series-snippet.txt", html.slice(0, 50000));
  console.log("wrote tmp-series-snippet.txt first 50k");
}

main().catch(console.error);
