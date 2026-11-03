const url =
  "https://hs-consumer-api.espncricinfo.com/v1/pages/match/comments?lang=en&seriesId=1449924&matchId=1473510&inningNumber=1&commentType=ALL&fromInningOver=0";

async function main() {
  const r = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json",
      Referer:
        "https://www.espncricinfo.com/series/ipl-2025-1449924/mumbai-indians-vs-punjab-kings-qualifier-2-1473510/ball-by-ball-commentary",
      Origin: "https://www.espncricinfo.com",
    },
  });
  console.log("status", r.status, (await r.text()).slice(0, 150));
}

main();
