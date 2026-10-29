import fs from "fs";

const h = fs.readFileSync("fixtures/cricbuzz-173517.html", "utf8");
const re = /id="(scard-team-\d+-innings-\d+)"/g;
const ids = new Set<string>();
let m: RegExpExecArray | null;
while ((m = re.exec(h))) ids.add(m[1]!);
console.log([...ids].sort());
