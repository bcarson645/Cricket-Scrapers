import { NVPLAY_ECB_CUSTOMER_ID } from "@/lib/scrapers/sites/nvplay-ecb/config";
import { fetchNvplayEcbWidgetAuth } from "@/lib/scrapers/sites/nvplay-ecb/widgetAuth";
import { nvplayEcbMatchUrlFromApiId } from "@/lib/scrapers/sites/nvplay-ecb/matchUrl";
import type { SiteMatchSummary } from "@/lib/scrapers/types";

export type NvplayMatchListRow = {
  MatchId?: string;
  MatchTitle?: string;
  MatchName?: string;
  Team1Name?: string;
  Team2Name?: string;
  CompetitionId?: number;
  CompetitionName?: string;
  StartDateTimeUTC?: string;
  StartDateFormatted?: string;
  IsComplete?: boolean;
  IsFixture?: boolean;
  HasScores?: boolean;
  VenueName?: string;
  Result?: string;
};

export type NvplayMatchWithCompetition = SiteMatchSummary & { competitionId: number | null };

export type NvplayCompetitionOption = {
  competitionId: number;
  competitionName: string;
  matchCount: number;
};

let cachedList: { fetchedAt: number; rows: NvplayMatchListRow[] } | null = null;
const CACHE_MS = 5 * 60 * 1000;

async function fetchAllMatchListRows(): Promise<NvplayMatchListRow[]> {
  const now = Date.now();
  if (cachedList && now - cachedList.fetchedAt < CACHE_MS) {
    return cachedList.rows;
  }
  const auth = await fetchNvplayEcbWidgetAuth();
  const base = auth.apiBaseUrl.replace(/\/$/, "");
  const url = `${base}/api/matchlist?customerId=${NVPLAY_ECB_CUSTOMER_ID}`;
  const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`NV Play match list HTTP ${res.status}`);
  }
  const rows = (await res.json()) as NvplayMatchListRow[];
  if (!Array.isArray(rows)) {
    throw new Error("NV Play match list returned non-array JSON");
  }
  cachedList = { fetchedAt: now, rows };
  return rows;
}

function utcDatePrefix(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
}

export function parseIsoDateParam(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const v = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  return v;
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
    url: nvplayEcbMatchUrlFromApiId(matchId),
    competitionId: row.CompetitionId ?? null,
  };
}

export function groupCompetitions(rows: NvplayMatchListRow[]): NvplayCompetitionOption[] {
  const map = new Map<number, { name: string; count: number }>();
  for (const row of rows) {
    const id = row.CompetitionId;
    const name = row.CompetitionName?.trim();
    if (id == null || !name) continue;
    const prev = map.get(id);
    if (prev) prev.count += 1;
    else map.set(id, { name, count: 1 });
  }
  return [...map.entries()]
    .map(([competitionId, { name, count }]) => ({
      competitionId,
      competitionName: name,
      matchCount: count,
    }))
    .sort((a, b) => a.competitionName.localeCompare(b.competitionName));
}

export async function discoverNvplayEcbMatches(options: {
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
