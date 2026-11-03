const base =
  "https://hs-consumer-api.espncricinfo.com/v1/pages/match/comments?lang=en&seriesId=1449924&matchId=1473510&inningNumber=1&commentType=ALL&fromInningOver=0";

async function main() {
  const r = await fetch(base, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
  });
  const t = await r.text();
  console.log("status", r.status, "len", t.length, "start", t.slice(0, 120));
  if (!t.startsWith("{")) return;
  const j = JSON.parse(t) as { comments?: unknown[]; nextInningOver?: number | null };
  console.log("comments", j.comments?.length, "nextInningOver", j.nextInningOver);
  const c = j.comments?.[0] as { overNumber?: number; ballNumber?: number; title?: string; totalRuns?: number };
  console.log("first in batch", c?.overNumber, c?.ballNumber, c?.title, c?.totalRuns);
}

main().catch((e) => console.error(e));
