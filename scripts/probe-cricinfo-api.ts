const urls = [
  "https://hs-consumer-api.espn-cricket.com/v1/pages/match/scorecard?lang=en&seriesId=1546521&matchId=1546585",
  "https://site.api.espn.com/apis/site/v2/sports/cricket/1546585/scorecard",
  "https://www.espncricinfo.com/api/cricket-match/1546585",
  "https://www.espncricinfo.com/matches/engine/match/1546585.json",
  "https://www.espncricinfo.com/api/match/1546585",
];

async function main() {
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
        },
      });
      const text = await res.text();
      console.log(url.slice(0, 80), res.status, text.slice(0, 100).replace(/\s+/g, " "));
    } catch (e) {
      console.log(url.slice(0, 80), "ERR", (e as Error).message);
    }
  }
}

main();
