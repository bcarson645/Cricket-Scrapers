import {
  extractCricinfoSeriesPageData,
  fetchCricinfoHtml,
} from "@/lib/scrapers/sites/cricinfo/fetchPageData";
import {
  normalizeCricinfoScorecardUrl,
  parseCricinfoMatchObjectId,
  parseEspnLeagueIdFromCricinfoUrl,
} from "@/lib/scrapers/sites/cricinfo/matchId";
import { buildCricinfoScorecardUrl } from "@/lib/scrapers/sites/cricinfo/seriesUrl";

const PLACEHOLDER_SCORECARD = /\/series\/x-\d+\/x-\d+\/full-scorecard$/i;

type CiSeriesMatch = {
  objectId?: number;
  slug?: string;
  hasScorecard?: boolean;
};

const scorecardUrlBySeriesCache = new Map<number, Map<string, string>>();

export function isCricinfoPlaceholderScorecardUrl(url: string): boolean {
  try {
    return PLACEHOLDER_SCORECARD.test(normalizeCricinfoScorecardUrl(url));
  } catch {
    return false;
  }
}

function seriesFixturesUrlForObjectId(seriesObjectId: number): string {
  return `https://www.espncricinfo.com/series/x-${seriesObjectId}/match-schedule-fixtures-and-results`;
}

export async function fetchCricinfoScorecardUrlMapForSeries(
  seriesObjectId: number,
): Promise<Map<string, string>> {
  const cached = scorecardUrlBySeriesCache.get(seriesObjectId);
  if (cached) return cached;

  const fixturesUrl = seriesFixturesUrlForObjectId(seriesObjectId);
  const html = await fetchCricinfoHtml(fixturesUrl, { requireNextData: true });
  const { matches } = extractCricinfoSeriesPageData(html);

  const map = new Map<string, string>();
  for (const raw of matches) {
    const m = raw as CiSeriesMatch;
    if (m.objectId == null || !m.hasScorecard) continue;
    const slug = m.slug?.trim();
    if (!slug) continue;
    map.set(String(m.objectId), buildCricinfoScorecardUrl(fixturesUrl, slug, m.objectId));
  }

  scorecardUrlBySeriesCache.set(seriesObjectId, map);
  return map;
}

export async function resolveCricinfoScorecardUrl(input: string): Promise<string> {
  const trimmed = input.trim();
  const normalized = normalizeCricinfoScorecardUrl(trimmed);
  const espnLeagueId = parseEspnLeagueIdFromCricinfoUrl(trimmed);
  const needsResolve = isCricinfoPlaceholderScorecardUrl(normalized) || espnLeagueId != null;
  if (!needsResolve) {
    return normalized;
  }

  let matchId: string;
  try {
    matchId = parseCricinfoMatchObjectId(normalized);
  } catch {
    return normalized;
  }

  if (espnLeagueId != null) {
    try {
      const map = await fetchCricinfoScorecardUrlMapForSeries(espnLeagueId);
      const resolved = map.get(matchId);
      if (resolved) return resolved;
    } catch {
      // fall through to placeholder URL
    }
  }

  return normalized;
}

export async function enrichCricinfoDiscoverUrls<T extends { matchId: string; url: string | null; seriesId?: number }>(
  matches: T[],
): Promise<void> {
  const bySeries = new Map<number, T[]>();
  for (const m of matches) {
    if (!m.url || m.seriesId == null) continue;
    const list = bySeries.get(m.seriesId) ?? [];
    list.push(m);
    bySeries.set(m.seriesId, list);
  }

  for (const [seriesId, group] of bySeries) {
    try {
      const map = await fetchCricinfoScorecardUrlMapForSeries(seriesId);
      for (const m of group) {
        const resolved = map.get(m.matchId);
        if (resolved) m.url = resolved;
      }
    } catch {
      // keep ESPN placeholder URLs
    }
  }
}
