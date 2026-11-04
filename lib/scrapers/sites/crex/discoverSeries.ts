import { fetchCrexSsrState } from "@/lib/scrapers/sites/crex/fetchPage";
import {
  buildCrexScorecardUrlFromLink,
  parseCrexMatchFkeyFromUrl,
} from "@/lib/scrapers/sites/crex/matchUrl";
import { normalizeCrexSeriesUrl } from "@/lib/scrapers/sites/crex/seriesUrl";
import type { CrexFixtureRow } from "@/lib/scrapers/sites/crex/types";
import {
  crexFixtureTitle,
  crexMatchHasScorecard,
  crexMdDateToExportDate,
} from "@/lib/scrapers/sites/crex/types";
import type { SiteMatchSummary } from "@/lib/scrapers/types";

function extractMatchLinks(html: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const m of html.matchAll(/href="(\/cricket-live-score\/[^"]+)"/gi)) {
    const path = m[1];
    const fk = path.match(/-([0-9A-Z]{3,})$/i)?.[1];
    if (fk) map.set(fk, path);
  }
  return map;
}

function seriesFixturesFromState(state: Record<string, unknown>): CrexFixtureRow[] {
  const overview = state["https://stats.crickapi.com/series/getSeriesOverview"] as
    | { i2?: CrexFixtureRow[] }
    | undefined;
  return overview?.i2 ?? [];
}

export async function discoverCrexSeriesMatches(seriesUrl: string): Promise<{
  seriesUrl: string;
  seriesTitle: string | null;
  matches: SiteMatchSummary[];
}> {
  const normalized = normalizeCrexSeriesUrl(seriesUrl);
  const { html, state } = await fetchCrexSsrState(normalized);
  const linkByFkey = extractMatchLinks(html);
  const rows = seriesFixturesFromState(state);

  const mapMain = state["https://oc.crickapi.com/mapping/getHomeMapDataseriesmain"] as
    | { s?: { f_key?: string; n?: string }[] }
    | undefined;
  const seriesTitle =
    mapMain?.s?.[0]?.n?.trim() ??
    rows[0]?.n?.trim() ??
    rows[0]?.seriesShortName?.trim() ??
    null;

  const matches: SiteMatchSummary[] = [];
  for (const row of rows) {
    const mf = row.mf?.trim();
    if (!mf) continue;
    const path = linkByFkey.get(mf);
    const url = path ? buildCrexScorecardUrlFromLink(path) : null;
    if (!crexMatchHasScorecard(row) && !url) continue;
    matches.push({
      matchId: mf,
      title: crexFixtureTitle(row),
      matchDate: crexMdDateToExportDate(row.date),
      competition: seriesTitle,
      url: url ?? (path ? buildCrexScorecardUrlFromLink(path) : null),
    });
  }

  matches.sort((a, b) => {
    const da = a.matchDate ?? "";
    const db = b.matchDate ?? "";
    if (da !== db) return da.localeCompare(db);
    return a.title.localeCompare(b.title);
  });

  return { seriesUrl: normalized, seriesTitle, matches };
}
