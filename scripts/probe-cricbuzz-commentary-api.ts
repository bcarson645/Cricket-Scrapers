const url = "https://www.cricbuzz.com/api/cricket-match/commentary/118928?iid=1";

async function main() {
  const r = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      Referer:
        "https://www.cricbuzz.com/live-cricket-over-by-over/118928/rcb-vs-pbks-final-indian-premier-league-2025?iid=1",
    },
  });
  const text = await r.text();
  console.log("status", r.status, "ctype", r.headers.get("content-type"), "len", text.length);
  if (!text.startsWith("{")) {
    console.log("body start", text.slice(0, 200));
    return;
  }
  const j = JSON.parse(text) as {
    commentaryList?: unknown[];
    miniscore?: Record<string, unknown>;
  };
  console.log("keys", Object.keys(j));
  const list = j.commentaryList ?? [];
  console.log("commentaryList", list.length);
  const balls = list.filter(
    (x) => typeof x === "object" && x !== null && "commText" in x && (x as { commText?: string }).commText,
  );
  console.log("with commText", balls.length);
  const sample = list.slice(-5);
  console.log("last5 types", sample.map((x) => (x as { commText?: string; overNum?: number }).commText?.slice(0, 40) ?? Object.keys(x as object).join(",")));
  const firstOver = list.filter(
    (x) => typeof x === "object" && x !== null && "overNum" in x && (x as { overNum?: number }).overNum === 1,
  );
  console.log("over 1 items", firstOver.length);
  console.log(JSON.stringify(firstOver.slice(0, 8), null, 2).slice(0, 4000));
}

main();
