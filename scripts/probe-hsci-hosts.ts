const urls = [
  "https://hs-consumer-api.cricinfo.com/v1/pages/match/comments?lang=en&seriesId=1449924&matchId=1473510&inningNumber=1&commentType=ALL&fromInningOver=0",
  "https://hs-consumer-api.espncricinfo.com/v1/pages/match/comments?lang=en&seriesId=1449924&matchId=1473510&inningNumber=1&commentType=ALL&fromInningOver=0",
];

async function main() {
  for (const u of urls) {
    const r = await fetch(u, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
        Referer:
          "https://www.espncricinfo.com/series/ipl-2025-1449924/mumbai-indians-vs-punjab-kings-qualifier-2-1473510/ball-by-ball-commentary",
      },
    });
    const t = await r.text();
    console.log(u.includes("cricinfo.com/v1") ? "cricinfo" : "espn", r.status, t.slice(0, 80));
  }
}

main();
