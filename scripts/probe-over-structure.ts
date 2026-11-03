import fs from "fs";
import { fetchCricinfoAppPageData } from "../lib/scrapers/sites/cricinfo/fetchPageData";

const url =
  "https://www.espncricinfo.com/series/ipl-2025-1449924/mumbai-indians-vs-punjab-kings-qualifier-2-1473510/full-scorecard";

async function main() {
  const { data } = await fetchCricinfoAppPageData(url);
  const inn = (data.content as { innings?: Record<string, unknown>[] }).innings?.[0];
  const overs = inn?.inningOvers as Record<string, unknown>[] | undefined;
  console.log("overs count", overs?.length);
  console.log("over0 keys", overs?.[0] ? Object.keys(overs[0]) : []);
  fs.writeFileSync("tmp-over0.json", JSON.stringify(overs?.[0], null, 2));
}

main();
