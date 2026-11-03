import fs from "fs";
import path from "path";
import {
  cchPlayersToCsv,
  fetchAllCchPlayerProfiles,
} from "@/lib/scrapers/sites/countycrickethub/playerRoster";

const siteArg = process.argv[2]?.toUpperCase();
const site =
  siteArg === "M" ? "M" : siteArg === "F" ? "F" : siteArg === "BOTH" ? "both" : "both";

const players = await fetchAllCchPlayerProfiles({ site });
const outDir = path.join(process.cwd(), "output");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `cch-players-${site === "both" ? "all" : site.toLowerCase()}.csv`);
fs.writeFileSync(outPath, cchPlayersToCsv(players), "utf8");

const sample = players.find((p) => p.playerId === 349);
console.log("Players", players.length);
if (sample) {
  console.log(
    "Sample 349:",
    sample.name,
    sample.batHand,
    sample.bowlingStyle,
    "age",
    sample.age,
    "DOB",
    sample.dateOfBirth,
  );
}
console.log("Wrote", outPath);
