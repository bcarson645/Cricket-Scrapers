const COMMENTARY =
  "https://www.espncricinfo.com/series/ipl-2025-1449924/mumbai-indians-vs-punjab-kings-qualifier-2-1473510/ball-by-ball-commentary";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function main() {
  const html = await fetch(COMMENTARY, { headers: { "User-Agent": UA } }).then((r) => r.text());
  const patterns = [
    /consumer-api[^"'\\s]+/g,
    /fromInningOver[^"'\\s]*/g,
    /commentary\?[^"'\\s]+/g,
    /\/v1\/pages\/match\/[^"'\\s]+/g,
    /inningNumber=\d+/g,
  ];
  for (const p of patterns) {
    const m = [...html.matchAll(p)].map((x) => x[0]);
    if (m.length) console.log(p.toString(), [...new Set(m)].slice(0, 8));
  }
  // paginated HTML query variants
  const tries = [
    `${COMMENTARY}?inningNumber=1&fromInningOver=0`,
    `${COMMENTARY}?inning=1&fromOver=0`,
    `${COMMENTARY}?view=commentary&inning=1&fromOver=0`,
  ];
  for (const u of tries) {
    const h = await fetch(u, { headers: { "User-Agent": UA } }).then((r) => r.text());
    const nd = h.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!nd) {
      console.log("no next", u);
      continue;
    }
    const comments = (
      JSON.parse(nd[1]).props as { appPageProps: { data: { content: { comments?: unknown[] } } } }
    ).appPageProps.data.content.comments;
    const first = comments?.[comments.length - 1] as { overNumber?: number; ballNumber?: number } | undefined;
    const last = comments?.[0] as { overNumber?: number; ballNumber?: number } | undefined;
    console.log(u.split("?")[1], "count", comments?.length, "range", last?.overNumber, last?.ballNumber, "to", first?.overNumber, first?.ballNumber);
  }
}

main();
