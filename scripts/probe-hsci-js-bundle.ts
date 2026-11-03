const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function main() {
  const pageUrl =
    "https://www.espncricinfo.com/series/ipl-2025-1449924/mumbai-indians-vs-punjab-kings-qualifier-2-1473510/ball-by-ball-commentary";
  const html = await fetch(pageUrl, { headers: { "User-Agent": UA } }).then((r) => r.text());
  const scripts = [...html.matchAll(/<script[^>]+src="(\/_next\/static\/[^"]+)"/g)].map((m) => m[1]);
  console.log("scripts", scripts.length);
  for (const src of scripts.slice(0, 5)) {
    const js = await fetch(`https://www.espncricinfo.com${src}`, { headers: { "User-Agent": UA } }).then((r) =>
      r.text(),
    );
    const has = js.includes("x-hsci-auth-token") || js.includes("hsci-auth");
    if (has) console.log("FOUND in", src, "len", js.length);
  }
  const inline = html.includes("x-hsci-auth-token");
  console.log("inline has token ref", inline);
}

main();
