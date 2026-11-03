const urls = [
  "https://hs-consumer-api.espn-cricket.com/v1/pages/match/ball-by-ball?lang=en&seriesId=1449924&matchId=1473511",
  "https://hs-consumer-api.espn-cricket.com/v1/pages/match/commentary?lang=en&seriesId=1449924&matchId=1473511",
  "https://hs-consumer-api.espn-cricket.com/v1/pages/match/commentary?lang=en&seriesId=1449924&matchId=1473511&inningNumber=1&commentType=ALL&sortDirection=ASC",
  "https://hs-consumer-api.espn-cricket.com/v1/pages/match/commentary?lang=en&seriesId=1449924&matchId=1473511&inningNumber=1&fromInningOver=0",
];

async function main() {
  for (const u of urls) {
    const r = await fetch(u, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    });
    const t = await r.text();
    console.log("\n===", u.slice(60), "===");
    console.log("status", r.status, "len", t.length);
    if (!t.startsWith("{")) {
      console.log("body", t.slice(0, 300));
      continue;
    }
    const j = JSON.parse(t) as {
      content?: { comments?: unknown[]; supportInfo?: Record<string, unknown> };
    };
    console.log("top keys", Object.keys(j));
    if (j.content) {
      console.log("content keys", Object.keys(j.content));
      console.log("comments", j.content.comments?.length);
      const c0 = j.content.comments?.[0] as Record<string, unknown> | undefined;
      if (c0) console.log("comment0 keys", Object.keys(c0));
      console.log("supportInfo", JSON.stringify(j.content.supportInfo)?.slice(0, 500));
    }
  }
}

main();
