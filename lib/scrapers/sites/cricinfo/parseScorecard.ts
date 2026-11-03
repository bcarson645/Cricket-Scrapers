import type {
  CricbuzzBatLine,
  CricbuzzBowlLine,
  CricbuzzInnings,
  CricbuzzParsedMatch,
} from "@/lib/scrapers/sites/cricbuzz/parseHtml";
import type { CricinfoAppPageData } from "@/lib/scrapers/sites/cricinfo/fetchPageData";

type CiPlayer = {
  objectId?: number;
  longName?: string;
  fieldingName?: string;
  battingName?: string;
};

type CiDismissalText = { long?: string; short?: string; commentary?: string };

type CiInningBatsman = {
  battedType?: string;
  runs?: number;
  balls?: number;
  fours?: number;
  sixes?: number;
  dismissalText?: CiDismissalText | string;
  player?: CiPlayer;
};

function dismissalRawFromCi(b: CiInningBatsman): string {
  const dt = b.dismissalText;
  if (dt && typeof dt === "object" && dt.long) {
    return dt.long.replace(/†/g, "").replace(/\s+/g, " ").trim();
  }
  if (typeof dt === "string") return dt.trim();
  return "";
}

type CiInningBowler = {
  overs?: number;
  maidens?: number;
  conceded?: number;
  wickets?: number;
  wides?: number;
  noballs?: number;
  player?: CiPlayer;
};

type CiInning = {
  inningNumber?: number;
  team?: { id?: number; longName?: string; name?: string };
  runs?: number;
  wickets?: number;
  extras?: number;
  byes?: number;
  legbyes?: number;
  wides?: number;
  noballs?: number;
  overs?: number;
  scheduledOvers?: number;
  inningBatsmen?: CiInningBatsman[];
  inningBowlers?: CiInningBowler[];
};

type CiTeamPlayers = {
  team?: { longName?: string; name?: string };
  players?: { player?: CiPlayer; isKeeper?: boolean }[];
};

function playerDisplayName(p: CiPlayer | undefined): string {
  return (p?.longName ?? p?.fieldingName ?? p?.battingName ?? "").trim();
}

function playerId(p: CiPlayer | undefined): string | null {
  return p?.objectId != null ? String(p.objectId) : null;
}

function formatLabelFromMatch(match: Record<string, unknown>): string {
  const fmt = String(match.format ?? "").toUpperCase();
  if (fmt === "TEST" || fmt === "FC" || fmt === "FIRSTCLASS") return "First Class";
  if (fmt === "ODI") return "ODI";
  if (fmt === "T20" || fmt === "T20I") return fmt === "T20I" ? "T20I Major" : "T20";
  return fmt || "First Class";
}

function parseMatchDate(match: Record<string, unknown>): string | null {
  const raw = match.startDate as string | undefined;
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
}

function teamLongName(entry: { team?: { longName?: string; name?: string } }): string {
  return entry.team?.longName ?? entry.team?.name ?? "Team";
}

function opponentName(
  battingTeam: string,
  teams: { team?: { longName?: string; name?: string } }[],
): string {
  const key = battingTeam.toLowerCase();
  const other = teams.find((t) => teamLongName(t).toLowerCase() !== key);
  return other ? teamLongName(other) : "Opposition";
}

function parseBatLine(b: CiInningBatsman, order: number): CricbuzzBatLine | null {
  const name = playerDisplayName(b.player);
  if (!name) return null;
  const raw = dismissalRawFromCi(b);
  const dismissalRaw =
    b.battedType === "yes" && !raw && b.runs != null ? "not out" : raw || "not out";
  return {
    order,
    name,
    cricbuzzPlayerId: playerId(b.player),
    dismissalRaw,
    runs: b.runs ?? 0,
    balls: b.balls ?? 0,
    fours: b.fours ?? 0,
    sixes: b.sixes ?? 0,
  };
}

function parseBowlLine(b: CiInningBowler): CricbuzzBowlLine | null {
  const name = playerDisplayName(b.player);
  if (!name) return null;
  return {
    name,
    cricbuzzPlayerId: playerId(b.player),
    overs: b.overs ?? 0,
    maidens: b.maidens ?? 0,
    runs: b.conceded ?? 0,
    wickets: b.wickets ?? 0,
    wides: b.wides ?? 0,
    noBalls: b.noballs ?? 0,
  };
}

function buildSquads(
  matchPlayers: { teamPlayers?: CiTeamPlayers[] },
  teamNames: string[],
): Record<string, { name: string; cricbuzzPlayerId: string | null }[]> {
  const squads: Record<string, { name: string; cricbuzzPlayerId: string | null }[]> = {};
  for (const block of matchPlayers.teamPlayers ?? []) {
    const label = teamLongName(block);
    if (!teamNames.some((t) => t.toLowerCase() === label.toLowerCase())) continue;
    const list = (block.players ?? [])
      .map((row) => {
        const name = playerDisplayName(row.player);
        if (!name) return null;
        const suffix = row.isKeeper ? " (wk)" : "";
        return {
          name: `${name}${suffix}`,
          cricbuzzPlayerId: playerId(row.player),
        };
      })
      .filter(Boolean) as { name: string; cricbuzzPlayerId: string | null }[];
    if (list.length >= 11) squads[label] = list.slice(0, 11);
  }
  return squads;
}

export function parseCricinfoScorecardData(
  page: CricinfoAppPageData,
  matchId: string,
): CricbuzzParsedMatch {
  const match = page.match;
  const content = page.content as {
    innings?: CiInning[];
    matchPlayers?: { teamPlayers?: CiTeamPlayers[] };
  };
  const inningsRaw = content.innings ?? [];
  const teams = (match.teams as { team?: { longName?: string; name?: string } }[]) ?? [];

  const teamInningsCount = new Map<number, number>();
  const innings: CricbuzzInnings[] = [];

  for (const inn of inningsRaw) {
    const inningsNumber = inn.inningNumber ?? innings.length + 1;
    const teamName = teamLongName(inn);
    const teamId = inn.team?.id ?? 0;
    const prev = teamInningsCount.get(teamId) ?? 0;
    const teamBattingInningsIndex = prev + 1;
    teamInningsCount.set(teamId, teamBattingInningsIndex);

    const batters: CricbuzzBatLine[] = [];
    let order = 0;
    const didNotBat: string[] = [];
    for (const row of inn.inningBatsmen ?? []) {
      if (row.battedType !== "yes") {
        const n = playerDisplayName(row.player);
        if (n) didNotBat.push(n);
        continue;
      }
      const line = parseBatLine(row, ++order);
      if (line) batters.push(line);
    }

    const bowlers = (inn.inningBowlers ?? [])
      .map(parseBowlLine)
      .filter((b): b is CricbuzzBowlLine => b != null);

    const scheduled = Number(match.scheduledOvers ?? 0);
    const oversCap = scheduled > 0 ? scheduled : Math.ceil(inn.overs ?? 90);

    innings.push({
      inningsNumber,
      teamBattingInningsIndex,
      teamName,
      opponentName: opponentName(teamName, teams),
      total: inn.runs ?? 0,
      wickets: inn.wickets ?? 0,
      extras: inn.extras ?? 0,
      extrasByes: inn.byes ?? 0,
      extrasLegByes: inn.legbyes ?? 0,
      extrasWides: inn.wides ?? 0,
      extrasNoBalls: inn.noballs ?? 0,
      oversCap,
      batters,
      didNotBat,
      bowlers,
    });
  }

  const teamNames = innings.map((i) => i.teamName);
  const squads = buildSquads(content.matchPlayers ?? {}, teamNames);
  const series = match.series as { longName?: string; name?: string } | undefined;
  const ground = match.ground as { name?: string; town?: string } | undefined;
  const venue = ground?.name ?? null;
  const titleParts = [
    teams.map((t) => teamLongName(t)).join(" vs "),
    series?.longName ?? series?.name ?? match.title,
  ].filter(Boolean);

  return {
    cricbuzzMatchId: matchId,
    dateDisplay: parseMatchDate(match),
    formatLabel: formatLabelFromMatch(match),
    maxOvers: innings[0]?.oversCap ?? null,
    venue,
    host: teams[0] ? teamLongName(teams[0]) : innings[0]?.teamName ?? null,
    title: titleParts.join(", "),
    innings,
    squads,
  };
}
