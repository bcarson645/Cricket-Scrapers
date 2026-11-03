const urls = [
  "https://www.cricbuzz.com/live-cricket-over-by-over/118928/rcb-vs-pbks-final-indian-premier-league-2025?iid=2",
  "https://www.cricbuzz.com/live-cricket-over-by-over/118928/rcb-vs-pbks-final-indian-premier-league-2025?iid=1",
];

async function main() {
  for (const url of urls) {
    const r = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    const html = await r.text();
    console.log("\n===", url.includes("iid=1") ? "inn 1" : "inn 2", "status", r.status, "len", html.length);
    const next = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (next) {
      const data = JSON.parse(next[1]).props?.pageProps ?? JSON.parse(next[1]).props?.appPageProps?.data;
      console.log("next keys", data ? Object.keys(data) : "nested");
    }
    const comm = html.match(/\\"commentaryList\\":\[/);
    const ballList = html.match(/ball-by-ball|ballByBall|overSeparator|commText/gi);
    console.log("embedded commentaryList", !!comm, "tokens", ballList?.slice(0, 8));
    const snippet = html.match(/commentaryList[\s\S]{0,200}/);
    console.log("snippet", snippet?.[0]?.slice(0, 180));
  }
}

main().catch(console.error);
