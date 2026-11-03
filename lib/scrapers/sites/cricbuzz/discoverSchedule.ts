import { normalizeCricbuzzScorecardUrl } from "@/lib/scrapers/sites/cricbuzz/matchId";
import {
  exportDisplayDateInRange,
  groupSeriesOptions,
  parseIsoDateParam,
  type SeriesOption,
} from "@/lib/scrapers/dateRangeFilter";
import type { SiteMatchSummary } from "@/lib/scrapers/types";

const LISTING_URLS = [
  "https://www.cricbuzz.com/cricket-match/live-scores/recent-matches",
  "https://www.cricbuzz.com/cricket-match/live-scores/upcoming-matches",
];

type RawScheduleRow = {
  matchId: string;
  seriesId: number;
  seriesName: string;
  title: string;
  matchDate: string | null;
};

function epochMsToListingDate(ms: string): string | null {
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return null;
  const d = new Date(n);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
}

function parseChunk(chunk: string, escaped: boolean): RawScheduleRow | null {
  const matchId = chunk.match(escaped ? /\\"matchId\\":(\d+)/ : /"matchId":(\d+)/)?.[1];
  const seriesId = chunk.match(escaped ? /\\"seriesId\\":(\d+)/ : /"seriesId":(\d+)/)?.[1];
  const seriesName = chunk.match(
    escaped ? /\\"seriesName\\":\\"([^\\"]*)\\"/ : /"seriesName":"([^"]*)"/,
  )?.[1];
  if (!matchId || !seriesId || !seriesName) return null;

  const startDate = chunk.match(escaped ? /\\"startDate\\":(\d+)/ : /"startDate":(\d+)/)?.[1];
  const teamNames = [
    ...chunk.matchAll(escaped ? /\\"teamSName\\":\\"([^\\"]*)\\"/g : /"teamSName":"([^"]*)"/g),
  ]
    .map((x) => x[1]!.trim())
    .filter(Boolean);
  const title =
    teamNames.length >= 2 ? `${teamNames[0]} vs ${teamNames[1]}` : `Match ${matchId}`;

  return {
    matchId,
    seriesId: Number(seriesId),
    seriesName: seriesName.trim(),
    title,
    matchDate: startDate ? epochMsToListingDate(startDate) : null,
  };
}

/** Parse match rows embedded in Cricbuzz live-scores / schedule HTML. */
export function parseCricbuzzScheduleEmbeddedJson(html: string): RawScheduleRow[] {
  const byId = new Map<string, RawScheduleRow>();

  const patterns: { re: RegExp; escaped: boolean }[] = [
    { re: /\\"matchId\\":\d+,\\"seriesId\\":\d+,\\"seriesName\\":\\"[^\\"]*\\"/g, escaped: true },
    { re: /"matchId":\d+,"seriesId":\d+,"seriesName":"[^"]*"/g, escaped: false },
  ];

  for (const { re, escaped } of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const chunk = html.slice(m.index, m.index + 2200);
      const row = parseChunk(chunk, escaped);
      if (!row || byId.has(row.matchId)) continue;
      byId.set(row.matchId, row);
    }
  }

  return [...byId.values()];
}

export type CricbuzzMatchWithSeries = SiteMatchSummary & { seriesId: number };

function toSummary(row: RawScheduleRow): CricbuzzMatchWithSeries | null {
  try {
    return {
      matchId: row.matchId,
      title: row.title,
      matchDate: row.matchDate,
      competition: row.seriesName,
      url: normalizeCricbuzzScorecardUrl(row.matchId),
      seriesId: row.seriesId,
    };
  } catch {
    return null;
  }
}

export async function discoverCricbuzzMatchesByDateRange(
  options: { from: string; to: string },
  fetchHtml: (url: string) => Promise<string>,
): Promise<{
  from: string;
  to: string;
  series: SeriesOption[];
  matches: CricbuzzMatchWithSeries[];
  totalInRange: number;
}> {
  const from = parseIsoDateParam(options.from);
  const to = parseIsoDateParam(options.to);
  if (!from || !to) throw new Error("from and to must be YYYY-MM-DD");
  if (from > to) throw new Error("from must be on or before to");

  const byId = new Map<string, RawScheduleRow>();
  for (const url of LISTING_URLS) {
    const html = await fetchHtml(url);
    for (const row of parseCricbuzzScheduleEmbeddedJson(html)) {
      if (!byId.has(row.matchId)) byId.set(row.matchId, row);
    }
  }

  const inRange = [...byId.values()].filter((row) =>
    exportDisplayDateInRange(row.matchDate, from, to),
  );

  const matches = inRange
    .map((row) => toSummary(row))
    .filter((m): m is CricbuzzMatchWithSeries => m != null)
    .sort((a, b) => {
      const da = a.matchDate ?? "";
      const db = b.matchDate ?? "";
      if (da !== db) return da.localeCompare(db);
      return a.title.localeCompare(b.title);
    });

  return {
    from,
    to,
    series: groupSeriesOptions(inRange),
    matches,
    totalInRange: inRange.length,
  };
}
