const url =
  "https://www.espncricinfo.com/series/ipl-2025-1449924/punjab-kings-vs-royal-challengers-bengaluru-final-1473511/ball-by-ball-commentary";

async function main() {
  const r = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  const html = await r.text();
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m?.[1]) throw new Error("no next");
  const data = JSON.parse(m[1]).props.appPageProps.data as {
    match: { objectId?: number };
    content: { comments?: unknown[]; supportInfo?: Record<string, unknown> };
  };
  console.log("matchId", data.match.objectId);
  console.log("comments on page", data.content.comments?.length);
  console.log("supportInfo", JSON.stringify(data.content.supportInfo, null, 2)?.slice(0, 1200));
}

main();
