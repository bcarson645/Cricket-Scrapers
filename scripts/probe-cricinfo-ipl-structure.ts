import fs from "fs";

const url =
  "https://www.espncricinfo.com/series/ipl-2025-1449924/punjab-kings-vs-royal-challengers-bengaluru-final-1473511/ball-by-ball-commentary";

async function main() {
  const html = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  }).then((r) => r.text());
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m?.[1]) throw new Error("no next");
  const data = JSON.parse(m[1]).props.appPageProps.data as {
    match: Record<string, unknown>;
    content: { comments?: unknown[]; supportInfo?: Record<string, unknown> };
  };
  fs.writeFileSync("tmp-ipl-support.json", JSON.stringify(data.content.supportInfo, null, 2));
  const c = data.content.comments ?? [];
  console.log("comments", c.length);
  const last = c[c.length - 1] as Record<string, unknown>;
  const first = c[0] as Record<string, unknown>;
  console.log("first keys", Object.keys(first));
  console.log("first", JSON.stringify(first, null, 2).slice(0, 1500));
  console.log("last over", last.overNumber, last.ballNumber, last.totalInningRuns);

  const hosts = [...html.matchAll(/https:\/\/[a-z0-9.-]+\.espn[a-z.-]*\.com/gi)].map((x) => x[0]);
  console.log("hosts", [...new Set(hosts)].slice(0, 15));
}

main();
