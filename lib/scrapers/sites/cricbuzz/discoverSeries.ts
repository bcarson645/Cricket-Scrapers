import type { SiteMatchSummary } from "@/lib/scrapers/types";
import { normalizeCricbuzzScorecardUrl } from "@/lib/scrapers/sites/cricbuzz/matchId";
import {
  parseCricbuzzMatchLinksFromHtml,
  sortMatchesByDateDesc,
} from "@/lib/scrapers/sites/cricbuzz/discoverListings";

const SERIES_ID = /cricbuzz\.com\/cricket-series\/(\d+)/i;

export function parseCricbuzzSeriesIdFromUrl(url: string): number {
  const m = url.match(SERIES_ID);
  if (!m?.[1]) throw new Error("Expected a Cricbuzz series URL (cricket-series/{id}/…)");
  return Number(m[1]);
}

/** Cricbuzz embeds escaped JSON in series /matches pages (RSC payload). */
export function parseCricbuzzSeriesMatchesFromEmbeddedJson(
  html: string,
  seriesId: number,
  competition: string | null,
): SiteMatchSummary[] {
  const byId = new Map<string, SiteMatchSummary>();
  const idRe = new RegExp(String.raw`\\"matchId\\":(\d+),\\"seriesId\\":${seriesId}`, "g");
  let m: RegExpExecArray | null;
  while ((m = idRe.exec(html)) !== null) {
    const matchId = m[1]!;
    if (byId.has(matchId)) continue;
    const chunk = html.slice(m.index, m.index + 2200);
    const startDate = chunk.match(/\\"startDate\\":\\"(\d+)\\"/)?.[1];
    const teamNames = [...chunk.matchAll(/\\"teamSName\\":\\"([^\\"]*)\\"/g)].map((x) => x[1]!.trim());
    if (teamNames.length < 2) continue;
    let url: string;
    try {
      url = normalizeCricbuzzScorecardUrl(matchId);
    } catch {
      continue;
    }
    byId.set(matchId, {
      matchId,
      title: `${teamNames[0]} vs ${teamNames[1]}`,
      matchDate: startDate ? epochMsToListingDate(startDate) : null,
      competition,
      url,
    });
  }

  if (byId.size > 0) return [...byId.values()];

  const plainIdRe = new RegExp(String.raw`"matchId":(\d+),"seriesId":${seriesId}`, "g");
  while ((m = plainIdRe.exec(html)) !== null) {
    const matchId = m[1]!;
    if (byId.has(matchId)) continue;
    const chunk = html.slice(m.index, m.index + 2200);
    const startDate = chunk.match(/"startDate":"(\d+)"/)?.[1];
    const teamNames = [...chunk.matchAll(/"teamSName":"([^"]*)"/g)].map((x) => x[1]!.trim());
    if (teamNames.length < 2) continue;
    let url: string;
    try {
      url = normalizeCricbuzzScorecardUrl(matchId);
    } catch {
      continue;
    }
    byId.set(matchId, {
      matchId,
      title: `${teamNames[0]} vs ${teamNames[1]}`,
      matchDate: startDate ? epochMsToListingDate(startDate) : null,
      competition,
      url,
    });
  }

  return [...byId.values()];
}

function epochMsToListingDate(ms: string): string | null {
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return null;
  const d = new Date(n);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getFullYear()}`;
}

/** User paste: series home, points table, or /matches — always fetch the matches tab. */
export function normalizeCricbuzzSeriesMatchesUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Series URL required");
  let url = trimmed.startsWith("http") ? trimmed : `https://www.cricbuzz.com${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
  url = url.replace(/\/+$/, "");
  if (!SERIES_ID.test(url)) {
    throw new Error("Expected a Cricbuzz series URL (cricket-series/{id}/…)");
  }
  if (!/\/matches(\/|$)/i.test(url)) {
    url = `${url}/matches`;
  }
  return url;
}

export function seriesTitleFromHtml(html: string): string | null {
  const og = html.match(/<meta property="og:title" content="([^"]+)"/i);
  if (og?.[1]) {
    return og[1].replace(/\s+schedule,.*/i, "").trim();
  }
  const title = html.match(/<title>([^<]+)<\/title>/i);
  if (title?.[1]) {
    return title[1].replace(/\s+schedule,.*/i, "").replace(/\s*\|\s*Cricbuzz\.com.*/i, "").trim();
  }
  return null;
}

export async function discoverCricbuzzSeriesMatches(
  seriesUrl: string,
  fetchHtml: (url: string) => Promise<string>,
): Promise<{ seriesUrl: string; seriesTitle: string | null; matches: SiteMatchSummary[] }> {
  const normalized = normalizeCricbuzzSeriesMatchesUrl(seriesUrl);
  const seriesId = parseCricbuzzSeriesIdFromUrl(normalized);
  const html = await fetchHtml(normalized);
  const seriesTitle = seriesTitleFromHtml(html);
  let matches = parseCricbuzzSeriesMatchesFromEmbeddedJson(html, seriesId, seriesTitle);
  if (matches.length === 0) {
    matches = parseCricbuzzMatchLinksFromHtml(html, seriesTitle);
  }
  return {
    seriesUrl: normalized,
    seriesTitle,
    matches: sortMatchesByDateDesc(matches),
  };
}
