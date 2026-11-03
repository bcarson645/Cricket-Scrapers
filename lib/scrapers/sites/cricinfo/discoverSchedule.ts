import {
  eachIsoDateInRange,
  groupSeriesOptions,
  inclusiveDayCount,
  isoToCricinfoResultsDateParam,
  parseIsoDateParam,
  type SeriesOption,
} from "@/lib/scrapers/dateRangeFilter";
import type { SiteMatchSummary } from "@/lib/scrapers/types";
import { fetchCricinfoHtml } from "@/lib/scrapers/sites/cricinfo/fetchPageData";

const RESULTS_BASE = "https://www.espncricinfo.com/live-cricket-match-results";
const MAX_DAYS_PER_REQUEST = 120;
const FETCH_CONCURRENCY = 6;

type CiSeriesRef = {
  objectId?: number;
  slug?: string;
  longName?: string;
  name?: string;
};

type CiScheduleMatch = {
  objectId?: number;
  slug?: string;
  title?: string;
  statusText?: string;
  hasScorecard?: boolean;
  startDate?: string;
  series?: CiSeriesRef;
  teams?: { team?: { longName?: string; name?: string } }[];
};

function formatMatchDate(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
}

function matchTitle(m: CiScheduleMatch): string {
  const teams = (m.teams ?? [])
    .map((t) => t.team?.longName ?? t.team?.name)
    .filter(Boolean);
  if (teams.length >= 2) {
    const label = m.title?.trim();
    return label ? `${teams[0]} vs ${teams[1]} (${label})` : `${teams[0]} vs ${teams[1]}`;
  }
  return m.title?.trim() || m.statusText?.trim() || "Match";
}

function buildScorecardUrl(series: CiSeriesRef, m: CiScheduleMatch): string | null {
  if (!m.hasScorecard) return null;
  const seriesSlug = series.slug?.trim();
  const seriesId = series.objectId;
  const slug = m.slug?.trim();
  const objectId = m.objectId;
  if (!seriesSlug || seriesId == null || !slug || objectId == null) return null;
  return `https://www.espncricinfo.com/series/${seriesSlug}-${seriesId}/${slug}-${objectId}/full-scorecard`;
}

function extractResultsMatches(html: string): CiScheduleMatch[] {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m?.[1]) throw new Error("Cricinfo results page did not include __NEXT_DATA__");
  const root = JSON.parse(m[1]) as {
    props?: { appPageProps?: { data?: { data?: { content?: { matches?: CiScheduleMatch[] } } } } };
  };
  const matches = root.props?.appPageProps?.data?.data?.content?.matches;
  if (!Array.isArray(matches)) {
    throw new Error("Cricinfo results payload has no matches list");
  }
  return matches;
}

async function fetchMatchesForResultsDay(dayIso: string): Promise<CiScheduleMatch[]> {
  const param = isoToCricinfoResultsDateParam(dayIso);
  const url = `${RESULTS_BASE}?date=${encodeURIComponent(param)}`;
  const html = await fetchCricinfoHtml(url);
  const all = extractResultsMatches(html);
  return all.filter((m) => m.startDate?.startsWith(dayIso));
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

export type CricinfoMatchWithSeries = SiteMatchSummary & { seriesId: number };

export async function discoverCricinfoMatchesByDateRange(options: {
  from: string;
  to: string;
  scorecardOnly?: boolean;
}): Promise<{
  from: string;
  to: string;
  series: SeriesOption[];
  matches: CricinfoMatchWithSeries[];
  totalInRange: number;
  daysQueried: number;
}> {
  const from = parseIsoDateParam(options.from);
  const to = parseIsoDateParam(options.to);
  if (!from || !to) throw new Error("from and to must be YYYY-MM-DD");
  if (from > to) throw new Error("from must be on or before to");

  const dayCount = inclusiveDayCount(from, to);
  if (dayCount == null) throw new Error("Invalid date range");
  if (dayCount > MAX_DAYS_PER_REQUEST) {
    throw new Error(`Date range is ${dayCount} days — narrow to ${MAX_DAYS_PER_REQUEST} days or fewer`);
  }

  const days = eachIsoDateInRange(from, to);
  const perDay = await mapPool(days, FETCH_CONCURRENCY, (day) => fetchMatchesForResultsDay(day));

  const byObjectId = new Map<number, CiScheduleMatch>();
  for (const list of perDay) {
    for (const m of list) {
      if (m.objectId != null) byObjectId.set(m.objectId, m);
    }
  }

  const seriesRows: { seriesId: number; seriesName: string }[] = [];
  const matches: CricinfoMatchWithSeries[] = [];

  for (const m of byObjectId.values()) {
    if (options.scorecardOnly && !m.hasScorecard) continue;
    const series = m.series;
    const seriesId = series?.objectId;
    if (seriesId == null || m.objectId == null || !series) continue;

    const seriesName = series.longName?.trim() || series.name?.trim() || `Series ${seriesId}`;
    seriesRows.push({ seriesId, seriesName });

    const title = matchTitle(m);
    const status = m.statusText?.trim();
    const fullTitle =
      status && !title.includes(status) ? `${title} - ${status}` : title;

    matches.push({
      matchId: String(m.objectId),
      title: fullTitle,
      matchDate: formatMatchDate(m.startDate),
      competition: seriesName,
      url: buildScorecardUrl(series, m),
      seriesId,
    });
  }

  matches.sort((a, b) => {
    const da = a.matchDate ?? "";
    const db = b.matchDate ?? "";
    if (da !== db) return da.localeCompare(db);
    return a.title.localeCompare(b.title);
  });

  return {
    from,
    to,
    series: groupSeriesOptions(seriesRows),
    matches,
    totalInRange: matches.length,
    daysQueried: days.length,
  };
}
