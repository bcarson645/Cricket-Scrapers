import { applyMappingRegistry } from "@/lib/mappings/apply";
import { loadMappingRegistry } from "@/lib/mappings/load";
import { cricbuzzToExportRows } from "@/lib/scrapers/sites/cricbuzz/buildExportRows";
import { fetchCrexSsrState } from "@/lib/scrapers/sites/crex/fetchPage";
import {
  normalizeCrexScorecardUrl,
  parseCrexMatchFkeyFromUrl,
} from "@/lib/scrapers/sites/crex/matchUrl";
import { parseCrexScorecardPayload } from "@/lib/scrapers/sites/crex/parseScorecard";

export {
  isCrexScorecardUrl,
  normalizeCrexScorecardUrl,
  parseCrexMatchFkeyFromUrl,
} from "@/lib/scrapers/sites/crex/matchUrl";

export async function scrapeCrexScorecard(
  url: string,
  options?: { matchIdOverride?: string | number; applyMappings?: boolean },
) {
  const scorecardUrl = normalizeCrexScorecardUrl(url);
  const matchFkey = parseCrexMatchFkeyFromUrl(scorecardUrl);
  const { html, state } = await fetchCrexSsrState(scorecardUrl);
  const parsed = parseCrexScorecardPayload({ html, state, matchFkey });
  let rows = cricbuzzToExportRows(parsed, {
    matchIdOverride: options?.matchIdOverride ?? matchFkey,
  });
  if (options?.applyMappings !== false) {
    rows = applyMappingRegistry(rows, parsed, loadMappingRegistry(), options);
  }
  return {
    parsed,
    rows,
    sourceUrl: scorecardUrl,
    fetchedFrom: scorecardUrl,
  };
}
