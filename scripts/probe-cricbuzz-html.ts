const url =
  "https://www.cricbuzz.com/live-cricket-over-by-over/118928/rcb-vs-pbks-final-indian-premier-league-2025?iid=1";

async function main() {
  const h = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  }).then((r) => r.text());
  console.log("len", h.length);
  for (const n of ["commentaryList", "commText", "overNum", "Arshdeep", "Salt", "__NEXT_DATA__"]) {
    console.log(n, h.includes(n));
  }
  const scripts = [...h.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  console.log("scripts", scripts.length);
  for (const s of scripts) {
    if (s.includes("commentary") || s.includes("118928")) {
      console.log("script snippet", s.slice(0, 200).replace(/\s+/g, " "));
    }
  }
}

main();
