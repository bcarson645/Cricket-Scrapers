import fs from "fs";
import { EXPORT_CSV_HEADERS } from "../lib/scorecards/export-columns";
import { normalizePersonName } from "../lib/scrapers/sites/cricbuzz/dismissal";

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function loadCsv(path: string): string[][] {
  const text = fs.readFileSync(path, "utf8").replace(/^\uFEFF/, "");
  return text
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map(parseCsvLine);
}

const COMPARE_COLS = ["Team", "Inns", "Order", "Runs", "Balls", "Fours", "Sixes", "Wickets", "Dismissal"];

function colIndex(header: string[], name: string, occurrence = 0): number {
  let n = 0;
  for (let i = 0; i < header.length; i++) {
    if (header[i] === name) {
      if (n === occurrence) return i;
      n++;
    }
  }
  return -1;
}

function rowKey(cells: string[], header: string[]): string {
  const team = cells[colIndex(header, "Team")] ?? "";
  const inns = cells[colIndex(header, "Inns")] ?? "";
  const order = cells[colIndex(header, "Order")] ?? "";
  return `${team}|${inns}|${order}`;
}

function bowlingRunsIdx(header: string[]): number {
  return colIndex(header, "Runs", 1);
}

const goldenPath = process.argv[2] ?? "C:/Users/b.carson/OneDrive - SportradarAG/sample game.csv";
const scrapedPath = process.argv[3] ?? "output/ind-nz-scraped.csv";

const g = loadCsv(goldenPath);
const s = loadCsv(scrapedPath);
const gHeader = g[0]!;
const sHeader = s[0]!;
const gRows = new Map(g.slice(1).map((r) => [rowKey(r, gHeader), r]));
const sRows = new Map(s.slice(1).map((r) => [rowKey(r, sHeader), r]));

let mismatches = 0;
for (const [key, gr] of gRows) {
  const sr = sRows.get(key);
  if (!sr) {
    console.log("MISSING scraped row", key);
    mismatches++;
    continue;
  }
  for (const col of COMPARE_COLS) {
    const gi = colIndex(gHeader, col);
    const si = colIndex(sHeader, col);
    const gv = (gr[gi] ?? "").trim();
    const sv = (sr[si] ?? "").trim();
    if (gv !== sv) {
      console.log(`DIFF ${key} ${col}: golden=${gv} scraped=${sv}`);
      mismatches++;
    }
  }
  const gBr = gr[bowlingRunsIdx(gHeader)] ?? "";
  const sBr = sr[bowlingRunsIdx(sHeader)] ?? "";
  if (gBr.trim() !== sBr.trim()) {
    console.log(`DIFF ${key} bowling Runs: golden=${gBr} scraped=${sBr}`);
    mismatches++;
  }
}

console.log(`\nGolden rows: ${gRows.size}, scraped: ${sRows.size}, mismatches: ${mismatches}`);
