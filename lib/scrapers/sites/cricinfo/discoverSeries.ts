import type { SiteMatchSummary } from "@/lib/scrapers/types";
import {
  buildCricinfoScorecardUrl,
  normalizeCricinfoSeriesFixturesUrl,
} from "@/lib/scrapers/sites/cricinfo/seriesUrl";
import {
  extractCricinfoSeriesPageData,
  fetchCricinfoSeriesPageHtml,
} from "@/lib/scrapers/sites/cricinfo/fetchPageData";

type CiTeamRef = { team?: { longName?: string; name?: string } };

type CiSeriesMatch = {
  objectId?: number;
  slug?: string;
  title?: string;
  statusText?: string;
  hasScorecard?: boolean;
  startDate?: string;
  teams?: CiTeamRef[];
};

function formatMatchDate(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
}

function matchTitle(m: CiSeriesMatch): string {
  const teams = (m.teams ?? [])
    .map((t) => t.team?.longName ?? t.team?.name)
    .filter(Boolean);
  if (teams.length >= 2) {
    const label = m.title?.trim();
    return label ? `${teams[0]} vs ${teams[1]} (${label})` : `${teams[0]} vs ${teams[1]}`;
  }
  return m.title?.trim() || m.statusText?.trim() || "Match";
}

function toSiteMatchSummary(seriesFixturesUrl: string, m: CiSeriesMatch): SiteMatchSummary | null {
  const objectId = m.objectId;
  const slug = m.slug?.trim();
  if (objectId == null || !slug) return null;

  const normalized = normalizeCricinfoSeriesFixturesUrl(seriesFixturesUrl);
  const url = m.hasScorecard
    ? buildCricinfoScorecardUrl(normalized, slug, objectId)
    : null;

  const title = matchTitle(m);
  const status = m.statusText?.trim();
  const fullTitle =
    status && !title.includes(status) ? `${title} - ${status}` : title;

  return {
    matchId: String(objectId),
    title: fullTitle,
    matchDate: formatMatchDate(m.startDate),
    competition: null,
    url,
  };
}

export async function discoverCricinfoSeriesMatches(seriesUrl: string): Promise<{
  seriesUrl: string;
  seriesTitle: string | null;
  matches: SiteMatchSummary[];
}> {
  const normalized = normalizeCricinfoSeriesFixturesUrl(seriesUrl);
  const html = await fetchCricinfoSeriesPageHtml(normalized);
  const { series, matches: rawMatches } = extractCricinfoSeriesPageData(html);

  const seriesTitle =
    (series.longName as string | undefined) ??
    (series.name as string | undefined) ??
    null;

  const matches: SiteMatchSummary[] = [];
  for (const raw of rawMatches) {
    const summary = toSiteMatchSummary(normalized, raw as CiSeriesMatch);
    if (summary) {
      summary.competition = seriesTitle;
      matches.push(summary);
    }
  }

  matches.sort((a, b) => {
    const da = a.matchDate ?? "";
    const db = b.matchDate ?? "";
    if (da !== db) return da.localeCompare(db);
    return a.matchId.localeCompare(b.matchId);
  });

  return { seriesUrl: normalized, seriesTitle, matches };
}
