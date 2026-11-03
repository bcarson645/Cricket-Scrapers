import fs from "fs";

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

const p = "C:/Users/b.carson/OneDrive - SportradarAG/sample game.csv";
const lines = fs.readFileSync(p, "utf8").split(/\r?\n/).filter(Boolean);
const h = parseCsvLine(lines[0]!);
const ci = h.indexOf("Catches");
console.log("Catches col", ci);
for (const line of lines.slice(1, 30)) {
  const r = parseCsvLine(line);
  if (r[ci] && r[ci] !== "0") {
    console.log(r[h.indexOf("Name")], r[h.indexOf("Team")], "catches", r[ci]);
  }
}
