import { fetchCricinfoAppPageData } from "../lib/scrapers/sites/cricinfo/fetchPageData";

const url =
  "https://www.espncricinfo.com/series/ipl-2025-1449924/mumbai-indians-vs-punjab-kings-qualifier-2-1473510/full-scorecard";

async function main() {
  const { data } = await fetchCricinfoAppPageData(url);
  const content = data.content as Record<string, unknown>;
  console.log("content keys", Object.keys(content));
  for (const k of Object.keys(content)) {
    const v = content[k];
    if (Array.isArray(v)) console.log(k, "array", v.length);
  }
  const match = data.match as Record<string, unknown>;
  console.log("match keys sample", Object.keys(match).slice(0, 30));
}

main().catch(console.error);
