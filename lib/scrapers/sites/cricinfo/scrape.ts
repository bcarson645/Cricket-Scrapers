import { applyMappingRegistry } from "@/lib/mappings/apply";
import { loadMappingRegistry } from "@/lib/mappings/load";
import { cricbuzzToExportRows } from "@/lib/scrapers/sites/cricbuzz/buildExportRows";
import type { CricbuzzParsedMatch } from "@/lib/scrapers/sites/cricbuzz/parseHtml";
import { fetchCricinfoAppPageData } from "@/lib/scrapers/sites/cricinfo/fetchPageData";
import { parseCricinfoMatchObjectId } from "@/lib/scrapers/sites/cricinfo/matchId";
import { parseCricinfoScorecardData } from "@/lib/scrapers/sites/cricinfo/parseScorecard";

export { isCricinfoScorecardUrl, normalizeCricinfoScorecardUrl, parseCricinfoMatchObjectId } from "@/lib/scrapers/sites/cricinfo/matchId";

export async function scrapeCricinfoScorecard(
  url: string,
  options?: { matchIdOverride?: string | number; applyMappings?: boolean },
) {
  const { sourceUrl, data } = await fetchCricinfoAppPageData(url);
  const cricinfoId = parseCricinfoMatchObjectId(sourceUrl);
  const parsed = parseCricinfoScorecardData(data, cricinfoId);
  let rows = cricbuzzToExportRows(parsed, {
    matchIdOverride: options?.matchIdOverride ?? cricinfoId,
  });
  if (options?.applyMappings !== false) {
    rows = applyMappingRegistry(rows, parsed, loadMappingRegistry(), options);
  }
  return {
    parsed,
    rows,
    sourceUrl: url.trim().startsWith("http") ? url.trim() : sourceUrl,
    fetchedFrom: sourceUrl,
  };
}
