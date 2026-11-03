import fs from "fs";

const golden = `1473510	6/1/2025	Indian Premier League	Punjab Kings	Mumbai Indians	Sardar Patel Stadium	India	Mumbai Indians	1	0	0	0	0	Arshdeep Singh	RG Sharma	0	1	0	0	JM Bairstow	0	0	0	0	120	0	1	1		0	0	0	0	0	0	4	0.1	0.1	FALSE	FALSE		Arshdeep Singh	RG Sharma
1473510	6/1/2025	Indian Premier League	Punjab Kings	Mumbai Indians	Sardar Patel Stadium	India	Mumbai Indians	1	1	0	1	0	Arshdeep Singh	RG Sharma	1	2	0	0	JM Bairstow	0	0	0	0	119	0	2	1		0	0	0	0	0	0	4	0.2	0.2	FALSE	FALSE		Arshdeep Singh	RG Sharma
1473510	6/1/2025	Indian Premier League	Punjab Kings	Mumbai Indians	Sardar Patel Stadium	India	Mumbai Indians	1	0	0	1	0	Arshdeep Singh	JM Bairstow	0	1	0	0	RG Sharma	1	2	0	0	118	0	3	1		0	0	0	0	0	0	4	0.3	0.3	FALSE	FALSE		Arshdeep Singh	JM Bairstow
1473510	6/1/2025	Indian Premier League	Punjab Kings	Mumbai Indians	Sardar Patel Stadium	India	Mumbai Indians	1	0	0	1	0	Arshdeep Singh	JM Bairstow	0	2	0	0	RG Sharma	1	2	0	0	117	0	4	1		0	0	0	0	0	0	4	0.4	0.4	FALSE	FALSE		Arshdeep Singh	JM Bairstow
1473510	6/1/2025	Indian Premier League	Punjab Kings	Mumbai Indians	Sardar Patel Stadium	India	Mumbai Indians	1	1	0	2	0	Arshdeep Singh	JM Bairstow	0	2	0	0	RG Sharma	1	2	0	0	117	0	5	1		0	0	1	0	0	0	4	0.5	0.5	FALSE	FALSE		Arshdeep Singh	JM Bairstow`;

const ours = fs.readFileSync("output/ball-by-ball-1473510.tsv", "utf8").trim().split("\n").slice(1, 6);

function cols(line: string) {
  return line.split("\t");
}

const headers = fs.readFileSync("output/ball-by-ball-1473510.tsv", "utf8").split("\n")[0].split("\t");
const idx = (h: string) => headers.indexOf(h);

console.log("=== Row count ===");
console.log("Golden sample (full match in paste): ~240+ rows");
console.log("Our export:", fs.readFileSync("output/ball-by-ball-1473510.tsv", "utf8").trim().split("\n").length - 1);

console.log("\n=== First 5 balls field diff (golden vs ours) ===");
const gLines = golden.trim().split("\n");
for (let i = 0; i < 5; i++) {
  const g = cols(gLines[i]);
  const o = cols(ours[i]);
  console.log("\n--- deliv", g[idx("deliv")], "---");
  for (const h of [
    "team1",
    "team2",
    "venue",
    "ballsRem",
    "wide",
    "bat1CumulativeBalls",
    "powerSurge",
    "maiden",
    "overRuns",
    "overWickets",
  ]) {
    const gi = gLines[i].split("\t");
    // golden has empty powerSurge column - approximate indices
  }
  const fields = [
    ["team1", 3, 3],
    ["team2", 4, 4],
    ["venue", 5, 5],
    ["ballsRem", 24, idx("ballsRem")],
    ["wide", 31, idx("wide")],
    ["bat1 balls", 16, idx("bat1CumulativeBalls")],
    ["overRuns", 35, idx("overRuns")],
  ] as const;
  for (const [label, gi, oi] of fields) {
    const gv = g[gi as number];
    const ov = o[oi as number];
    if (gv !== ov) console.log(`  ${label}: golden "${gv}" vs ours "${ov}"`);
  }
}
