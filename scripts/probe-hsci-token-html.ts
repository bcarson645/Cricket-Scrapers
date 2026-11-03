const COMMENTARY =
  "https://www.espncricinfo.com/series/ipl-2025-1449924/mumbai-indians-vs-punjab-kings-qualifier-2-1473510/ball-by-ball-commentary";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function main() {
  const html = await fetch(COMMENTARY, { headers: { "User-Agent": UA } }).then((r) => r.text());
  for (const pat of [/x-hsci-auth-token[^\\n]{0,200}/gi, /hsci[^"']{0,80}/gi, /auth-token[^"']+/gi]) {
    const m = html.match(pat);
    if (m) console.log("match", m[0].slice(0, 150));
  }
  const exp = html.match(/exp=\d+~hmac=[a-f0-9]+/);
  console.log("hmac token in html", exp?.[0]?.slice(0, 80));
  // check response headers from commentary page for token
  const res = await fetch(COMMENTARY, { headers: { "User-Agent": UA } });
  console.log("set-cookie", res.headers.get("set-cookie")?.slice(0, 100));
}

main();
