import fs from "fs";
import { parseCricbuzzScorecardHtml } from "@/lib/scrapers/sites/cricbuzz/parseHtml";
import { cricbuzzToExportRows } from "@/lib/scrapers/sites/cricbuzz/buildExportRows";
import { EXPORT_CSV_HEADERS } from "@/lib/scorecards/export-columns";

const html = fs.readFileSync("fixtures/cricbuzz-139478-scorecard.html", "utf8");
const parsed = parseCricbuzzScorecardHtml(html, "139478");
const rows = cricbuzzToExportRows(parsed, { matchIdOverride: 1512773 });
const nameI = EXPORT_CSV_HEADERS.indexOf("Name");
const catI = EXPORT_CSV_HEADERS.indexOf("Catches");
const seen = new Set<string>();
for (const row of rows) {
  const name = row[nameI];
  const cat = row[catI];
  if (!name || seen.has(String(name))) continue;
  seen.add(String(name));
  if (cat && cat !== 0) console.log(name, cat);
}
