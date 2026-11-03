import fs from "fs";
import { fetchCricinfoScorecardHtml } from "../lib/scrapers/sites/cricinfo/fetchPageData";

type CiBall = { id?: number; oversActual?: number; inningNumber?: number; totalInningRuns?: number };

async function main() {
  const h = await fetchCricinfoScorecardHtml(
    "https://www.espncricinfo.com/series/ipl-2025-1449924/mumbai-indians-vs-punjab-kings-qualifier-2-1473510/full-scorecard",
  );
  const byId = new Map<number, CiBall>();
  const re = /\{"_uid":\d+,"id":(\d+)[\s\S]*?"oversActual":([\d.]+)[\s\S]*?"inningNumber":(\d+)[\s\S]*?"totalInningRuns":(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(h)) !== null) {
    const id = Number(m[1]);
    byId.set(id, {
      id,
      oversActual: Number(m[2]),
      inningNumber: Number(m[3]),
      totalInningRuns: Number(m[4]),
    });
  }
  console.log("unique balls regex", byId.size);
  const balls = [...byId.values()].sort((a, b) => (a.inningNumber! - b.inningNumber!) || (a.oversActual! - b.oversActual!));
  console.log("sample", balls.slice(0, 3), "...", balls.slice(-3));
  fs.writeFileSync("tmp-extracted-balls.json", JSON.stringify(balls, null, 2));
}

main();
