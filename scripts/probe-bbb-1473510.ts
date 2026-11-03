const SCORECARD =
  "https://www.espncricinfo.com/series/ipl-2025-1449924/mumbai-indians-vs-punjab-kings-qualifier-2-1473510/full-scorecard";
const COMMENTARY =
  "https://www.espncricinfo.com/series/ipl-2025-1449924/mumbai-indians-vs-punjab-kings-qualifier-2-1473510/ball-by-ball-commentary";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function nextData(html: string): Record<string, unknown> {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m?.[1]) throw new Error("no __NEXT_DATA__");
  return JSON.parse(m[1]) as Record<string, unknown>;
}

async function main() {
  const html = await fetch(COMMENTARY, { headers: { "User-Agent": UA } }).then((r) => r.text());
  const buildId = html.match(/"buildId":"([^"]+)"/)?.[1];
  console.log("buildId", buildId);
  const data = (nextData(html).props as { appPageProps: { data: Record<string, unknown> } }).appPageProps.data;
  const content = data.content as { comments?: unknown[]; supportInfo?: Record<string, unknown> };
  console.log("comments on page", content.comments?.length);
  const match = data.match as { objectId?: number; series?: { objectId?: number } };
  console.log("matchId", match.objectId, "seriesId", match.series?.objectId);

  // try _next/data JSON
  if (buildId) {
    const path =
      "/series/ipl-2025-1449924/mumbai-indians-vs-punjab-kings-qualifier-2-1473510/ball-by-ball-commentary.json";
    const u = `https://www.espncricinfo.com/_next/data/${buildId}${path}?slug=ipl-2025-1449924&slug=mumbai-indians-vs-punjab-kings-qualifier-2-1473510`;
    const r = await fetch(u, { headers: { "User-Agent": UA, Accept: "application/json" } });
    console.log("_next/data", r.status, (await r.text()).slice(0, 200));
  }

  const apiUrls = [
    `https://hs-consumer-api.espn-cricket.com/v1/pages/match/commentary?lang=en&seriesId=1449924&matchId=1473510&inningNumber=1&commentType=ALL&sortDirection=ASC`,
    `https://hs-consumer-api.espn-cricket.com/v1/pages/match/commentary?lang=en&seriesId=1449924&matchId=1473510&inningNumber=1&fromInningOver=0`,
    `https://hs-consumer-api.espn-cricket.com/v1/pages/match/ball-by-ball?lang=en&seriesId=1449924&matchId=1473510`,
  ];
  for (const u of apiUrls) {
    try {
      const r = await fetch(u, { headers: { "User-Agent": UA, Accept: "application/json" } });
      const t = await r.text();
      console.log("\nAPI", u.split("?")[1], r.status, t.length, t.startsWith("{") ? Object.keys(JSON.parse(t)) : t.slice(0, 80));
    } catch (e) {
      console.log("API err", (e as Error).message);
    }
  }

  const scHtml = await fetch(SCORECARD, { headers: { "User-Agent": UA } }).then((r) => r.text());
  const sc = (nextData(scHtml).props as { appPageProps: { data: Record<string, unknown> } }).appPageProps.data;
  const innings = (sc.content as { innings?: { inningNumber?: number; runs?: number; wickets?: number }[] }).innings ?? [];
  console.log(
    "\nscorecard innings",
    innings.map((i) => ({ inn: i.inningNumber, runs: i.runs, wkts: i.wickets })),
  );
}

main();
