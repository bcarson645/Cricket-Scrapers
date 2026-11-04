import {
  eachIsoDateInRange,
  groupSeriesOptions,
  inclusiveDayCount,
  parseIsoDateParam,
  type SeriesOption,
} from "@/lib/scrapers/dateRangeFilter";
import type { SiteMatchSummary } from "@/lib/scrapers/types";
import { enrichCricinfoDiscoverUrls } from "@/lib/scrapers/sites/cricinfo/resolveScorecardUrl";

const ESPN_CRICKET_HEADER =
  "https://site.web.api.espn.com/apis/personalized/v2/scoreboard/header?sport=cricket";

type EspnLeague = {
  id?: string;
  name?: string;
  events?: EspnEvent[];
};

type EspnEvent = {
  id?: string;
  name?: string;
  date?: string;
  status?: string;
  description?: string;
  title?: string;
  fullStatus?: { summary?: string; type?: { state?: string } };
};

function espnEventHasScorecard(ev: EspnEvent): boolean {
  const state = ev.fullStatus?.type?.state ?? ev.status;
  return state === "post" || state === "in";
}

function formatMatchDate(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
}

function buildPlaceholderScorecardUrl(matchId: number, espnLeagueId: number): string {
  return `https://www.espncricinfo.com/series/x-${matchId}/x-${matchId}/full-scorecard#espnLeague=${espnLeagueId}`;
}

async function fetchEspnCricketHeader(): Promise<EspnLeague[]> {
  const res = await fetch(ESPN_CRICKET_HEADER, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`ESPN cricket header HTTP ${res.status}`);
  }
  const json = (await res.json()) as { sports?: { leagues?: EspnLeague[] }[] };
  return json.sports?.[0]?.leagues ?? [];
}

type CricinfoMatchWithSeries = SiteMatchSummary & { seriesId: number };

export async function discoverCricinfoMatchesViaEspn(options: {
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
  discoverSource: "espn";
}> {
  const from = parseIsoDateParam(options.from);
  const to = parseIsoDateParam(options.to);
  if (!from || !to) throw new Error("from and to must be YYYY-MM-DD");
  if (from > to) throw new Error("from must be on or before to");

  const dayCount = inclusiveDayCount(from, to);
  if (dayCount == null) throw new Error("Invalid date range");
  if (dayCount > 120) {
    throw new Error(`Date range is ${dayCount} days — narrow to 120 days or fewer`);
  }

  const days = new Set(eachIsoDateInRange(from, to));
  const leagues = await fetchEspnCricketHeader();

  const seriesRows: { seriesId: number; seriesName: string }[] = [];
  const matches: CricinfoMatchWithSeries[] = [];
  const seenMatchIds = new Set<number>();

  for (const league of leagues) {
    const seriesId = Number(league.id);
    if (!Number.isFinite(seriesId)) continue;
    const seriesName = league.name?.trim() || `Series ${seriesId}`;

    for (const ev of league.events ?? []) {
      const matchId = Number(ev.id);
      if (!Number.isFinite(matchId) || seenMatchIds.has(matchId)) continue;

      const dayIso = ev.date?.slice(0, 10);
      if (!dayIso || !days.has(dayIso)) continue;

      if (options.scorecardOnly && !espnEventHasScorecard(ev)) continue;

      seenMatchIds.add(matchId);
      seriesRows.push({ seriesId, seriesName });

      const status = ev.fullStatus?.summary?.trim() || ev.status?.trim();
      const title = ev.name?.trim() || ev.description?.trim() || "Match";
      const fullTitle =
        status && !title.includes(status) ? `${title} - ${status}` : title;

      matches.push({
        matchId: String(matchId),
        title: fullTitle,
        matchDate: formatMatchDate(ev.date),
        competition: seriesName,
        url: buildPlaceholderScorecardUrl(matchId, seriesId),
        seriesId,
      });
    }
  }

  matches.sort((a, b) => {
    const da = a.matchDate ?? "";
    const db = b.matchDate ?? "";
    if (da !== db) return da.localeCompare(db);
    return a.title.localeCompare(b.title);
  });

  await enrichCricinfoDiscoverUrls(matches);

  return {
    from,
    to,
    series: groupSeriesOptions(seriesRows),
    matches,
    totalInRange: matches.length,
    daysQueried: days.size,
    discoverSource: "espn",
  };
}
