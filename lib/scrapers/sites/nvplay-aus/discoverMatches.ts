import { nvplayAusMatchUrlFromApiId } from "@/lib/scrapers/sites/nvplay-aus/urls";
import { fetchNvplayAusMatchListRows } from "@/lib/scrapers/sites/nvplay-aus/fetchScorecard";
import type {
  NvplayCompetitionOption,
  NvplayMatchListRow,
  NvplayMatchWithCompetition,
} from "@/lib/scrapers/sites/nvplay-ecb/discoverMatches";
import {
  groupCompetitions,
  parseIsoDateParam,
} from "@/lib/scrapers/sites/nvplay-ecb/discoverMatches";

export type { NvplayCompetitionOption, NvplayMatchWithCompetition } from "@/lib/scrapers/sites/nvplay-ecb/discoverMatches";

let cachedList: { fetchedAt: number; rows: NvplayMatchListRow[] } | null = null;
const CACHE_MS = 5 * 60 * 1000;

async function fetchAllMatchListRows(): Promise<NvplayMatchListRow[]> {
  const now = Date.now();
  if (cachedList && now - cachedList.fetchedAt < CACHE_MS) {
    return cachedList.rows;
  }
  const rows = await fetchNvplayAusMatchListRows();
  cachedList = { fetchedAt: now, rows };
  return rows;
}

function utcDatePrefix(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
}

function nvplayRowToSummary(row: NvplayMatchListRow): NvplayMatchWithCompetition | null {
  const matchId = row.MatchId?.trim();
  if (!matchId) return null;
  const team1 = row.Team1Name?.trim() ?? "";
  const team2 = row.Team2Name?.trim() ?? "";
  const title =
    row.MatchTitle?.trim() ||
    row.MatchName?.trim() ||
    (team1 && team2 ? `${team1} v ${team2}` : team1 || team2 || matchId);
  const day = utcDatePrefix(row.StartDateTimeUTC) ?? row.StartDateFormatted?.trim() ?? null;
  return {
    matchId,
    title,
    matchDate: day,
    competition: row.CompetitionName?.trim() ?? null,
    url: nvplayAusMatchUrlFromApiId(matchId),
    competitionId: row.CompetitionId ?? null,
  };
}

export async function discoverNvplayAusMatches(options: {
  from: string;
  to: string;
  completeOnly?: boolean;
}): Promise<{
  from: string;
  to: string;
  competitions: NvplayCompetitionOption[];
  matches: NvplayMatchWithCompetition[];
  totalInRange: number;
}> {
  const from = parseIsoDateParam(options.from);
  const to = parseIsoDateParam(options.to);
  if (!from || !to) {
    throw new Error("from and to must be YYYY-MM-DD");
  }
  if (from > to) {
    throw new Error("from must be on or before to");
  }

  const all = await fetchAllMatchListRows();
  const inRange = all.filter((row) => {
    const day = utcDatePrefix(row.StartDateTimeUTC);
    if (!day || day < from || day > to) return false;
    if (options.completeOnly && !row.IsComplete) return false;
    return Boolean(row.MatchId);
  });

  const matches = inRange
    .map((row) => nvplayRowToSummary(row))
    .filter((m): m is NvplayMatchWithCompetition => m != null)
    .sort((a, b) => {
      const da = a.matchDate ?? "";
      const db = b.matchDate ?? "";
      if (da !== db) return da.localeCompare(db);
      return a.title.localeCompare(b.title);
    });

  return {
    from,
    to,
    competitions: groupCompetitions(inRange),
    matches,
    totalInRange: inRange.length,
  };
}
