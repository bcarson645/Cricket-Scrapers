import { applyMappingRegistry } from "@/lib/mappings/apply";
import { loadMappingRegistry } from "@/lib/mappings/load";
import { cricbuzzToExportRows } from "@/lib/scrapers/sites/cricbuzz/buildExportRows";
import { fetchNvplayAusScorecard } from "@/lib/scrapers/sites/nvplay-aus/fetchScorecard";
import { parseNvplayScorecardToCricbuzz } from "@/lib/scrapers/sites/nvplay-aus/parseScorecard";
import { normalizeNvplayAusMatchUrl, parseNvplayAusMatchIdFromUrl } from "@/lib/scrapers/sites/nvplay-aus/matchUrl";

export {
  isNvplayAusMatchUrl,
  normalizeNvplayAusMatchUrl,
  parseNvplayAusMatchIdFromUrl,
  nvplayMatchUrlLooksLikeAus,
} from "@/lib/scrapers/sites/nvplay-aus/matchUrl";

export async function scrapeNvplayAusScorecard(
  urlOrMatchId: string,
  options?: { matchIdOverride?: string | number; applyMappings?: boolean },
) {
  const matchId = parseNvplayAusMatchIdFromUrl(urlOrMatchId);
  const { data, apiBaseUrl } = await fetchNvplayAusScorecard(matchId);
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
    sourceUrl: normalizeNvplayAusMatchUrl(urlOrMatchId),
    fetchedFrom: `${apiBaseUrl}/api/scorecard/${matchId}`,
  };
}
