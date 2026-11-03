const url =
  "https://www.cricbuzz.com/live-cricket-over-by-over/118928/rcb-vs-pbks-final-indian-premier-league-2025?iid=1";

async function main() {
  const h = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  }).then((r) => r.text());
  const paths = new Set<string>();
  for (const m of h.matchAll(/\/api\/[a-zA-Z0-9/_-]+/g)) paths.add(m[0]);
  console.log("api paths", [...paths].slice(0, 30));
  console.log("has comm", h.includes("comm"));
  console.log("has miniscore", h.includes("miniscore"));
  for (const needle of ["commentary", "overDetails", "matchCommentary", "118928"]) {
    const i = h.indexOf(needle);
    if (i >= 0) console.log(needle, "at", i, h.slice(i, i + 120).replace(/\s+/g, " "));
  }
}

main();
