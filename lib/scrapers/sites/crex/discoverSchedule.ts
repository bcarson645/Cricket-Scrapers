import {
  exportDisplayDateInRange,
  groupSeriesOptions,
  parseIsoDateParam,
  type SeriesOption,
} from "@/lib/scrapers/dateRangeFilter";
import { CREX_SCHEDULE_PAGE } from "@/lib/scrapers/sites/crex/config";
import { fetchCrexSsrState } from "@/lib/scrapers/sites/crex/fetchPage";
import { buildCrexScorecardUrlFromLink } from "@/lib/scrapers/sites/crex/matchUrl";
import { crexSeriesIdFromSf } from "@/lib/scrapers/sites/crex/seriesId";
import type { CrexFixtureRow } from "@/lib/scrapers/sites/crex/types";
import { crexFixtureTitle, crexMatchHasScorecard, crexMdDateToExportDate } from "@/lib/scrapers/sites/crex/types";
import type { SiteMatchSummary } from "@/lib/scrapers/types";

export type CrexMatchWithSeries = SiteMatchSummary & { seriesId: number };

function fixtureRowsFromScheduleState(state: Record<string, unknown>): CrexFixtureRow[] {
  const raw = state["https://stats.crickapi.com/fixture/getFixture"];
  if (Array.isArray(raw)) return raw as CrexFixtureRow[];
  return [];
}

function rowToSummary(row: CrexFixtureRow): CrexMatchWithSeries | null {
  const mf = row.mf?.trim();
  const sf = row.sf?.trim();
  if (!mf || !sf) return null;
  const seriesName = row.n?.trim() || row.seriesShortName?.trim() || sf;
  const link = row.link?.trim();
  const url = link ? buildCrexScorecardUrlFromLink(link) : null;
  return {
    matchId: mf,
    title: crexFixtureTitle(row),
    matchDate: crexMdDateToExportDate(row.date),
    competition: seriesName,
    url,
    seriesId: crexSeriesIdFromSf(sf),
  };
}

export async function discoverCrexScheduleMatches(options: {
  from: string;
  to: string;
  scorecardOnly?: boolean;
}): Promise<{
  from: string;
  to: string;
  series: SeriesOption[];
  matches: CrexMatchWithSeries[];
  totalInRange: number;
  daysQueried: number;
  scheduleNote: string;
}> {
  const from = parseIsoDateParam(options.from);
  const to = parseIsoDateParam(options.to);
  if (!from || !to) {
    throw new Error("from and to must be YYYY-MM-DD");
  }
  if (from > to) {
    throw new Error("from must be on or before to");
  }

  const { state } = await fetchCrexSsrState(CREX_SCHEDULE_PAGE);
  const fixtures = fixtureRowsFromScheduleState(state);

  const inRange = fixtures.filter((row) => {
    const day = crexMdDateToExportDate(row.date);
    if (!day || !exportDisplayDateInRange(day, from, to)) return false;
    if (options.scorecardOnly && !crexMatchHasScorecard(row)) return false;
    return Boolean(row.mf && row.sf);
  });

  const matches = inRange
    .map((row) => rowToSummary(row))
    .filter((m): m is CrexMatchWithSeries => m != null)
    .sort((a, b) => {
      const da = a.matchDate ?? "";
      const db = b.matchDate ?? "";
      if (da !== db) return da.localeCompare(db);
      return a.title.localeCompare(b.title);
    });

  const seriesRows = matches.map((m) => ({
    seriesId: m.seriesId,
    seriesName: m.competition ?? "Series",
  }));

  return {
    from,
    to,
    series: groupSeriesOptions(seriesRows),
    matches,
    totalInRange: matches.length,
    daysQueried: 1,
    scheduleNote:
      "Crex /schedule embeds a short rolling fixture window (typically a few days). Widen coverage with the Series tab or paste a scorecard URL.",
  };
}
