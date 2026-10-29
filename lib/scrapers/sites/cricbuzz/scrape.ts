import { applyMappingRegistry } from "@/lib/mappings/apply";
import { loadMappingRegistry } from "@/lib/mappings/load";
import type { ScorecardMatch } from "@/lib/scorecards/types";
import {
  isCricbuzzScoresUrl,
  normalizeCricbuzzScorecardUrl,
  parseCricbuzzMatchId,
} from "@/lib/scrapers/sites/cricbuzz/matchId";
import { cricbuzzToExportRows } from "@/lib/scrapers/sites/cricbuzz/buildExportRows";
import { parseCricbuzzScorecardHtml } from "@/lib/scrapers/sites/cricbuzz/parseHtml";

export { isCricbuzzScoresUrl, normalizeCricbuzzScorecardUrl, parseCricbuzzMatchId };

const DEFAULT_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-GB,en;q=0.9",
};

export async function fetchCricbuzzHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: DEFAULT_HEADERS, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Cricbuzz HTTP ${res.status} for ${url}`);
  }
  return res.text();
}

export function parseCricbuzzScorecardHtmlToMatch(
  html: string,
  matchId: string,
  sourceUrl: string,
): ScorecardMatch {
  const parsed = parseCricbuzzScorecardHtml(html, matchId);
  const rows = cricbuzzToExportRows(parsed);
  return {
    id: matchId,
    sourceFile: null,
    date: parsed.dateDisplay,
    format: parsed.formatLabel,
    maxOvers: parsed.maxOvers,
    venue: parsed.venue,
    host: parsed.host,
    competitionId: null,
    venueId: null,
    hostId: null,
    innings: [],
    teamTotals: {},
    winner: null,
    result: "decided",
    topBatter: null,
    topBowler: null,
    rowCount: rows.length,
    sourceUrl,
  };
}

export async function scrapeCricbuzzScorecard(
  urlOrId: string,
  options?: { matchIdOverride?: string | number; applyMappings?: boolean },
) {
  const input = urlOrId.trim();
  const scorecardUrl = normalizeCricbuzzScorecardUrl(input);
  const matchId = parseCricbuzzMatchId(input);
  const html = await fetchCricbuzzHtml(scorecardUrl);
  const parsed = parseCricbuzzScorecardHtml(html, matchId);
  let rows = cricbuzzToExportRows(parsed, options);
  if (options?.applyMappings !== false) {
    rows = applyMappingRegistry(rows, parsed, loadMappingRegistry(), options);
  }
  const match = parseCricbuzzScorecardHtmlToMatch(html, matchId, scorecardUrl);
  return {
    parsed,
    rows,
    match,
    sourceUrl: input.startsWith("http") ? input : scorecardUrl,
    fetchedFrom: scorecardUrl,
  };
}
