import { applyMappingRegistry } from "@/lib/mappings/apply";
import { loadMappingRegistry } from "@/lib/mappings/load";
import { cricbuzzToExportRows } from "@/lib/scrapers/sites/cricbuzz/buildExportRows";
import { fetchNvplayEcbScorecard } from "@/lib/scrapers/sites/nvplay-ecb/fetchScorecard";
import { parseNvplayScorecardToCricbuzz } from "@/lib/scrapers/sites/nvplay-ecb/parseScorecard";
import { normalizeNvplayEcbMatchUrl, parseNvplayEcbMatchIdFromUrl } from "@/lib/scrapers/sites/nvplay-ecb/matchUrl";

export {
  isNvplayEcbMatchUrl,
  normalizeNvplayEcbMatchUrl,
  parseNvplayEcbMatchIdFromUrl,
  nvplayMatchUrlLooksLikeEcb,
} from "@/lib/scrapers/sites/nvplay-ecb/matchUrl";

export async function scrapeNvplayEcbScorecard(
  urlOrMatchId: string,
  options?: { matchIdOverride?: string | number; applyMappings?: boolean },
) {
  const matchId = parseNvplayEcbMatchIdFromUrl(urlOrMatchId);
  const { data, apiBaseUrl } = await fetchNvplayEcbScorecard(matchId);
  const parsed = parseNvplayScorecardToCricbuzz(data, matchId);
  let rows = cricbuzzToExportRows(parsed, {
    matchIdOverride: options?.matchIdOverride ?? matchId,
  });
  if (options?.applyMappings !== false) {
    rows = applyMappingRegistry(rows, parsed, loadMappingRegistry(), options);
  }
  return {
    parsed,
    rows,
    sourceUrl: normalizeNvplayEcbMatchUrl(urlOrMatchId),
    fetchedFrom: `${apiBaseUrl}/api/scorecard/${matchId}`,
  };
}
