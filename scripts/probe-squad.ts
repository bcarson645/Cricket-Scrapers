import fs from "fs";
import * as cheerio from "cheerio";

const html = fs.readFileSync("fixtures/cricbuzz-139489.html", "utf8");
const $ = cheerio.load(html);

const squadLinks = $('a[href*="/profiles/"]')
  .filter((_, el) => {
    const href = $(el).attr("href") ?? "";
    return !href.includes("player-match-performance");
  })
  .map((_, el) => {
    const title = $(el).attr("title")?.replace("View Profile Of ", "") ?? $(el).text().trim();
    const id = $(el).attr("href")?.match(/profiles\/(\d+)/)?.[1];
    return `${id}:${title}`;
  })
  .get();

// unique preserve order
const seen = new Set<string>();
for (const s of squadLinks) {
  const id = s.split(":")[0];
  if (seen.has(id)) continue;
  seen.add(id);
  if (s.includes("India") || s.includes("Samson") || s.includes("Patel") || s.includes("Bumrah")) {
    console.log(s);
  }
}

console.log("--- dnb order fix: India squad block ---");
$("div.font-bold")
  .filter((_, el) => $(el).text().trim() === "India")
  .each((_, el) => {
    const block = $(el).parent().parent();
    block.find('a[href*="/profiles/"]').each((_, a) => {
      console.log($(a).attr("title") ?? $(a).text());
    });
  });
