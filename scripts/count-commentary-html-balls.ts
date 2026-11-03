const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function main() {
  const u =
    "https://www.espncricinfo.com/series/ipl-2025-1449924/mumbai-indians-vs-punjab-kings-qualifier-2-1473510/ball-by-ball-commentary";
  const h = await fetch(u, { headers: { "User-Agent": UA } }).then((r) => r.text());
  console.log("len", h.length, "oversActual", (h.match(/oversActual/g) ?? []).length);
}

main();
