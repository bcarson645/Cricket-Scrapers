const COMMENTARY =
  "https://www.espncricinfo.com/series/ipl-2025-1449924/mumbai-indians-vs-punjab-kings-qualifier-2-1473510/ball-by-ball-commentary";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function main() {
  const html = await fetch(COMMENTARY, { headers: { "User-Agent": UA } }).then((r) => r.text());
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m?.[1]) throw new Error("no next");
  const raw = m[1];
  for (const needle of ["consumer", "hsci", "auth", "fromInningOver", "nextInningOver", "api.espn"]) {
    const idx = raw.indexOf(needle);
    if (idx >= 0) console.log(needle, raw.slice(Math.max(0, idx - 40), idx + 120).replace(/\s+/g, " "));
  }
}

main();
