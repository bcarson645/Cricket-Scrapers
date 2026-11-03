import { fetchCricinfoScorecardHtml } from "../lib/scrapers/sites/cricinfo/fetchPageData";

async function main() {
  const url =
    "https://www.espncricinfo.com/series/ipl-2025-1449924/mumbai-indians-vs-punjab-kings-qualifier-2-1473510/full-scorecard";
  const html = await fetchCricinfoScorecardHtml(url);
  console.log("len", html.length);
  const hmac = html.match(/exp=\d+~hmac=[a-f0-9]+/g);
  console.log("hmac tokens", hmac?.length, hmac?.[0]?.slice(0, 60));
  const api = [...html.matchAll(/hs-consumer-api[^"'\\s]+/g)].map((m) => m[0]);
  console.log("api refs", [...new Set(api)].slice(0, 5));
}

main();
