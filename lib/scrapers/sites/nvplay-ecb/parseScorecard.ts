import type {
  CricbuzzBatLine,
  CricbuzzBowlLine,
  CricbuzzInnings,
  CricbuzzParsedMatch,
} from "@/lib/scrapers/sites/cricbuzz/parseHtml";
import type { NvplayInning, NvplayScorecardPayload } from "@/lib/scrapers/sites/nvplay-ecb/fetchScorecard";

function parseNum(s: string | number | undefined | null): number {
  if (s == null) return 0;
  if (typeof s === "number") return Number.isFinite(s) ? s : 0;
  const n = Number(String(s).trim());
  return Number.isFinite(n) ? n : 0;
}

function parseOversString(overs: string | undefined): number {
  if (!overs) return 0;
  const t = overs.trim();
  if (!t.includes(".")) return parseNum(t);
  const [o, b] = t.split(".");
  return parseNum(o) + parseNum(b) / 6;
}

function formatLabelFromMatchType(matchType: string | undefined): string {
  const t = (matchType ?? "").toLowerCase();
  if (t.includes("4 day") || t.includes("3 day") || t.includes("2 day") || t.includes("first")) {
    return "First Class";
  }
  if (t.includes("50 over") || t.includes("one day") || t.includes("odi")) return "ODI";
  if (t.includes("t20")) return "T20";
  return matchType?.trim() || "First Class";
}

function parseDateDisplay(iso: string | undefined, formatted: string | undefined): string | null {
  if (iso) {
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) {
      return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
    }
  }
  if (formatted?.trim()) return formatted.trim();
  return null;
}

function opponentForTeam(
  battingTeam: string,
  team1: string,
  team2: string,
): string {
  const key = battingTeam.toLowerCase();
  if (team1.toLowerCase() === key) return team2;
  if (team2.toLowerCase() === key) return team1;
  return team1.toLowerCase() === key ? team2 : team1;
}

function parseBatLine(row: NonNullable<NvplayInning["BattingCard"]>[number], order: number): CricbuzzBatLine | null {
  const name = row.PlayerName?.trim();
  if (!name || row.IsSummary) return null;
  if (!row.HasBatted) return null;
  let dismissalRaw = (row.HowOut ?? "").trim();
  if (!row.IsDismissed) dismissalRaw = dismissalRaw || "not out";
  return {
    order,
    name,
    cricbuzzPlayerId: row.Id ?? null,
    dismissalRaw,
    runs: row.Runs ?? 0,
    balls: row.Balls ?? 0,
    fours: row.Fours ?? 0,
    sixes: row.Sixes ?? 0,
  };
}

function parseBowlLine(row: NonNullable<NvplayInning["BowlingCard"]>[number]): CricbuzzBowlLine | null {
  const name = row.PlayerName?.trim();
  if (!name) return null;
  return {
    name,
    cricbuzzPlayerId: row.Id ?? null,
    overs: parseOversString(row.Overs),
    maidens: row.Maidens ?? 0,
    runs: row.Runs ?? 0,
    wickets: row.Wickets ?? 0,
    wides: row.Wides ?? 0,
    noBalls: row.NoBalls ?? 0,
  };
}

function buildSquads(
  match: Record<string, unknown>,
  team1: string,
  team2: string,
): Record<string, { name: string; cricbuzzPlayerId: string | null }[]> {
  type P = { Id?: string; PlayerName?: string };
  const squadFrom = (players: P[] | undefined) =>
    (players ?? [])
      .map((p) => ({
        name: p.PlayerName?.trim() ?? "",
        cricbuzzPlayerId: p.Id ?? null,
      }))
      .filter((p) => p.name)
      .slice(0, 11);

  const t1 = squadFrom(match.Team1Players as P[] | undefined);
  const t2 = squadFrom(match.Team2Players as P[] | undefined);
  const out: Record<string, { name: string; cricbuzzPlayerId: string | null }[]> = {};
  if (t1.length >= 11) out[team1] = t1;
  if (t2.length >= 11) out[team2] = t2;
  return out;
}

export function parseNvplayScorecardToCricbuzz(
  payload: NvplayScorecardPayload,
  matchId: string,
): CricbuzzParsedMatch {
  const match = payload.Match ?? {};
  const team1 = String(match.Team1Name ?? "Team 1");
  const team2 = String(match.Team2Name ?? "Team 2");
  const inningsRaw = payload.Innings ?? [];

  const teamInningsCount = new Map<string, number>();
  const innings: CricbuzzInnings[] = [];

  for (let i = 0; i < inningsRaw.length; i++) {
    const inn = inningsRaw[i]!;
    const teamName = inn.BattingTeamName?.trim() || team1;
    const prev = teamInningsCount.get(teamName.toLowerCase()) ?? 0;
    const teamBattingInningsIndex = prev + 1;
    teamInningsCount.set(teamName.toLowerCase(), teamBattingInningsIndex);

    const batters: CricbuzzBatLine[] = [];
    const didNotBat: string[] = [];
    let order = 0;
    for (const row of inn.BattingCard ?? []) {
      if (row.IsSummary) continue;
      if (!row.HasBatted) {
        const n = row.PlayerName?.trim();
        if (n) didNotBat.push(n);
        continue;
      }
      const line = parseBatLine(row, ++order);
      if (line) batters.push(line);
    }

    const bowlers = (inn.BowlingCard ?? [])
      .map(parseBowlLine)
      .filter((b): b is CricbuzzBowlLine => b != null);

    const scheduled = parseNum(match.MaxOvers as number | undefined);
    const oversCap =
      inn.MaxOvers && inn.MaxOvers > 0
        ? inn.MaxOvers
        : scheduled > 0
          ? scheduled
          : 90;

    innings.push({
      inningsNumber: i + 1,
      teamBattingInningsIndex,
      teamName,
      opponentName: opponentForTeam(teamName, team1, team2),
      total: inn.TotalRuns ?? 0,
      wickets: inn.TotalWickets ?? 0,
      extras: inn.TotalExtras ?? 0,
      extrasByes: inn.TotalByes ?? 0,
      extrasLegByes: inn.TotalLegByes ?? 0,
      extrasWides: 0,
      extrasNoBalls: 0,
      oversCap,
      batters,
      didNotBat,
      bowlers,
    });
  }

  const venue = [match.VenueName, match.VenueCity].filter(Boolean).join(", ") || null;
  const title = `${team1} vs ${team2}, ${match.CompetitionName ?? "ECB"}`;

  return {
    cricbuzzMatchId: matchId,
    dateDisplay: parseDateDisplay(
      match.StartDateTimeUTC as string | undefined,
      match.StartDateFormatted as string | undefined,
    ),
    formatLabel: formatLabelFromMatchType(match.MatchType as string | undefined),
    maxOvers: innings[0]?.oversCap ?? (parseNum(match.MaxOvers as number | undefined) || null),
    venue,
    host: "England",
    title,
    innings,
    squads: buildSquads(match, team1, team2),
  };
}
