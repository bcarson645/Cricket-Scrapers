const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const seriesId = process.argv[2] ?? "1449924";
const matchId = process.argv[3] ?? "1473510";
const outPath =
  process.argv[4] ??
  path.join(process.cwd(), "output", `comments-${matchId}.json`);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let token = null;
  page.on("request", (req) => {
    const h = req.headers()["x-hsci-auth-token"];
    if (h) token = h;
  });
  const pageUrl = `https://www.espncricinfo.com/series/ipl-2025-${seriesId}/mumbai-indians-vs-punjab-kings-qualifier-2-${matchId}/ball-by-ball-commentary`;
  await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(8000);
  if (!token) {
    console.error("No x-hsci-auth-token captured");
    await browser.close();
    process.exit(1);
  }
  console.log("Captured auth token");

  async function fetchChunk(inningNumber, fromInningOver) {
    const u = `https://hs-consumer-api.espncricinfo.com/v1/pages/match/comments?lang=en&seriesId=${seriesId}&matchId=${matchId}&inningNumber=${inningNumber}&commentType=ALL&fromInningOver=${fromInningOver}`;
    const r = await page.request.get(u, {
      headers: { "x-hsci-auth-token": token, Accept: "application/json" },
    });
    if (!r.ok()) throw new Error(`HTTP ${r.status()} ${u}`);
    return r.json();
  }

  const all = [];
  for (const inn of [1, 2]) {
    let from = 0;
    for (let guard = 0; guard < 80; guard++) {
      const j = await fetchChunk(inn, from);
      all.push(...(j.comments || []));
      console.log("inn", inn, "from", from, "got", j.comments?.length, "next", j.nextInningOver);
      if (j.nextInningOver == null) break;
      from = j.nextInningOver;
    }
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(all));
  console.log("Wrote", outPath, "total", all.length);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
