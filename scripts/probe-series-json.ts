import { fetchCricbuzzHtml } from "../lib/scrapers/sites/cricbuzz/scrape";

async function main() {
  const html = await fetchCricbuzzHtml(
    "https://www.cricbuzz.com/cricket-series/11408/county-championship-division-one-2026/matches",
  );
  const simple = /\\"matchId\\":(\d+),\\"seriesId\\":11408/g;
  const ids: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = simple.exec(html)) !== null) ids.push(m[1]!);
  console.log("simple ids", ids.length, [...new Set(ids)].slice(0, 10));

  const chunk = html.slice(html.indexOf("142030") - 20, html.indexOf("142030") + 500);
  const teamTest =
    /\\"startDate\\":\\"(\d+)\\"[\\s\\S]*?\\"teamSName\\":\\"([^\\"]*)\\"[\\s\\S]*?\\"teamSName\\":\\"([^\\"]*)\\"/;
  console.log("teamTest on chunk", teamTest.exec(chunk));
}

main().catch(console.error);
