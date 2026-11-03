const urls = [
  "https://hs-consumer-api.espn-cricket.com/v1/pages/match/ball-by-ball?lang=en&seriesId=1558225&matchId=1558231",
  "https://hs-consumer-api.espn-cricket.com/v1/pages/match/commentary?lang=en&seriesId=1558225&matchId=1558231",
  "https://www.espncricinfo.com/series/ireland-in-namibia-2026-27-1558225/namibia-vs-ireland-1st-odi-1558231/ball-by-ball-commentary",
];

async function main() {
  for (const u of urls) {
    try {
      const r = await fetch(u.replace(" ", ""), {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json,text/html" },
      });
      const t = await r.text();
      console.log("\n===", u.slice(0, 90), "===");
      console.log("status", r.status, "len", t.length);
      if (t.startsWith("{")) {
        const j = JSON.parse(t) as Record<string, unknown>;
        console.log("keys", Object.keys(j));
        const content = (j as { content?: Record<string, unknown> }).content;
        if (content) console.log("content keys", Object.keys(content));
      } else {
        const m = t.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
        if (m) {
          const data = JSON.parse(m[1]).props?.appPageProps?.data;
          console.log("next data keys", data ? Object.keys(data) : "none");
          const c = data?.content;
          if (c) console.log("content keys", Object.keys(c));
        }
      }
    } catch (e) {
      console.log("ERR", (e as Error).message);
    }
  }
}

main();
