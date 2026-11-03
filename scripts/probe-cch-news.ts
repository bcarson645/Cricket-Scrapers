import { writeFileSync } from "fs";

async function main() {
  const url = "https://countycrickethub.net/news-injury.html?site=M";
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; CricketScrapers/1.0)" },
  });
  const html = await res.text();
  writeFileSync("tmp-cch-news.html", html);
  console.log("len", html.length);
  const table = html.match(/<table[\s\S]{0,500}/i);
  console.log("table start", table?.[0]?.slice(0, 500));
}

main().catch(console.error);
