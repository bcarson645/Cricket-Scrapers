import fs from "fs";
import * as cheerio from "cheerio";

const html = fs.readFileSync("fixtures/cricbuzz-139489.html", "utf8");
const $ = cheerio.load(html);

function listBowlers(sel: string, inningsId: string) {
  const root = $(sel);
  const seen = new Set<string>();
  root.find(`a[href*="bowling?inningsId=${inningsId}"]`).each((_, a) => {
    const href = $(a).attr("href") ?? "";
    const m = href.match(/player\/(\d+)\//);
    const pid = m?.[1] ?? href;
    if (seen.has(pid)) return;
    seen.add(pid);
    const title = $(a).attr("title")?.replace("View match performance of ", "") ?? "";
    const grid = $(a).closest(".grid");
    const stats = grid
      .find(".flex.justify-center.items-center")
      .map((_, c) => $(c).text().trim())
      .get();
    console.log(title, stats.join("|"));
  });
}

listBowlers("#scard-team-2-innings-1", "1");
listBowlers("#scard-team-13-innings-2", "2");
