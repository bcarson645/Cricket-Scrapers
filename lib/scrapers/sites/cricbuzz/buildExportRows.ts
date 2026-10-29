import {
  emptyExportRow,
  setBattingRuns,
  setBowlingOvers,
  setBowlingRuns,
  setBowlingWides,
  setCol,
  setExtrasBreakdown,
  setExtrasWides,
  setTeamExtras,
  setTeamOversCap,
  type ExportRow,
} from "@/lib/scorecards/export-columns";
import { mapCricbuzzDismissal, normalizePersonName } from "@/lib/scrapers/sites/cricbuzz/dismissal";
import {
  findBowler,
  isMultiInningsMatch,
  type CricbuzzBatLine,
  type CricbuzzBowlLine,
  type CricbuzzInnings,
  type CricbuzzParsedMatch,
} from "@/lib/scrapers/sites/cricbuzz/parseHtml";

type SquadMember = {
  name: string;
  cricbuzzPlayerId: string | null;
  order: number;
  batting: CricbuzzBatLine | null;
};

function wicketKeeperNames(innings: CricbuzzInnings[]): string[] {
  const names: string[] = [];
  for (const inn of innings) {
    for (const b of inn.batters) {
      if (/\(wk\)/i.test(b.name)) names.push(b.name.replace(/\(wk\)/i, "").trim());
    }
  }
  return names;
}

export function buildSquadFromInnings(
  inn: CricbuzzInnings,
  squadList?: { name: string; cricbuzzPlayerId: string | null }[],
): SquadMember[] {
  if (squadList?.length === 11) {
    const members = buildSquadWithList(inn, squadList);
    const matchedBatters = members.filter((m) => m.batting !== null).length;
    if (matchedBatters >= inn.batters.length) return members;
  }
  return buildSquadWithList(inn);
}

function buildSquadWithList(
  inn: CricbuzzInnings,
  squadList?: { name: string; cricbuzzPlayerId: string | null }[],
): SquadMember[] {
  if (squadList?.length === 11) {
    const batByName = new Map(inn.batters.map((b) => [normalizePersonName(b.name), b]));
    return squadList.map((s, i) => {
      const bat = batByName.get(normalizePersonName(s.name)) ?? null;
      return {
        name: s.name,
        cricbuzzPlayerId: s.cricbuzzPlayerId ?? bat?.cricbuzzPlayerId ?? null,
        order: i + 1,
        batting: bat,
      };
    });
  }

  const members: SquadMember[] = inn.batters.map((b) => ({
    name: b.name,
    cricbuzzPlayerId: b.cricbuzzPlayerId,
    order: b.order,
    batting: b,
  }));

  let nextOrder = members.length + 1;
  for (const dnbName of inn.didNotBat) {
    members.push({
      name: dnbName.trim(),
      cricbuzzPlayerId: null,
      order: nextOrder++,
      batting: null,
    });
  }
  return members;
}

function topBatterInInnings(inn: CricbuzzInnings): CricbuzzBatLine | null {
  if (!inn.batters.length) return null;
  return inn.batters.reduce((a, b) => (b.runs > a.runs ? b : a));
}

function topBatterInMatch(innings: CricbuzzInnings[]): CricbuzzBatLine | null {
  const all = innings.flatMap((i) => i.batters);
  if (!all.length) return null;
  return all.reduce((a, b) => (b.runs > a.runs ? b : a));
}

function topBowlerInInnings(bowlers: CricbuzzBowlLine[]): CricbuzzBowlLine | null {
  const withWkts = bowlers.filter((b) => b.wickets > 0);
  if (!withWkts.length) return null;
  return withWkts.reduce((a, b) =>
    b.wickets > a.wickets || (b.wickets === a.wickets && b.runs < a.runs) ? b : a,
  );
}

function topBowlerInMatch(innings: CricbuzzInnings[]): CricbuzzBowlLine | null {
  return topBowlerInInnings(innings.flatMap((i) => i.bowlers));
}

function samePlayer(a: string, b: string): boolean {
  const na = normalizePersonName(a);
  const nb = normalizePersonName(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

function sameTeamName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Bowling figures for players when their side is fielding (opposition batting innings). */
function bowlersWhenTeamFielded(parsed: CricbuzzParsedMatch, battingInn: CricbuzzInnings): CricbuzzBowlLine[] {
  return parsed.innings
    .filter((i) => sameTeamName(i.teamName, battingInn.opponentName))
    .flatMap((i) => i.bowlers);
}

function exportInnsValue(inn: CricbuzzInnings, parsed: CricbuzzParsedMatch): number {
  if (isMultiInningsMatch(parsed)) return inn.teamBattingInningsIndex;
  return inn.inningsNumber;
}

export function cricbuzzToExportRows(
  parsed: CricbuzzParsedMatch,
  options?: { matchIdOverride?: string | number },
): ExportRow[] {
  const rows: ExportRow[] = [];
  const wkNames = wicketKeeperNames(parsed.innings);
  const matchTopBat = topBatterInMatch(parsed.innings);
  const matchTopBowl = topBowlerInMatch(parsed.innings);
  const chaseTarget = parsed.innings.find((i) => i.inningsNumber === 1)?.total ?? null;

  for (const inn of parsed.innings) {
    const bowlingWhenFielding = bowlersWhenTeamFielded(parsed, inn);
    const innTopBat = topBatterInInnings(inn);
    const innTopBowl = topBowlerInInnings(bowlingWhenFielding);

    for (const member of buildSquadFromInnings(inn, parsed.squads[inn.teamName])) {
      const row = emptyExportRow();
      const bat = member.batting;
      const bowl = findBowler(bowlingWhenFielding, member.name);

      setCol(row, "ID", options?.matchIdOverride ?? parsed.cricbuzzMatchId);
      setCol(row, "Date", parsed.dateDisplay);
      setCol(row, "Format", parsed.formatLabel);
      setCol(row, "Max", parsed.maxOvers);
      setCol(row, "Venue", parsed.venue);
      setCol(row, "Host", parsed.host);
      setCol(row, "Team", inn.teamName);
      setCol(row, "Opps", inn.opponentName);
      setCol(row, "Inns", exportInnsValue(inn, parsed));
      setCol(row, "Total", inn.total);
      setCol(row, "Wkts", inn.wickets);
      setTeamExtras(row, inn.extras);
      setCol(row, "Order", member.order);
      setCol(row, "Name", member.name);

      if (bat) {
        setCol(
          row,
          "Dismissal",
          mapCricbuzzDismissal(bat.dismissalRaw, wkNames),
        );
        setBattingRuns(row, bat.runs);
        setCol(row, "Balls", bat.balls);
        setCol(row, "Fours", bat.fours);
        setCol(row, "Sixes", bat.sixes);
        setCol(row, "Tp.Bt", innTopBat && samePlayer(bat.name, innTopBat.name) ? 1 : 0);
        setCol(
          row,
          "Match.Tp.Bt",
          matchTopBat && samePlayer(bat.name, matchTopBat.name) ? 1 : 0,
        );
      } else {
        setCol(row, "Dismissal", "dnb");
        setBattingRuns(row, 0);
        setCol(row, "Balls", 0);
        setCol(row, "Fours", 0);
        setCol(row, "Sixes", 0);
        setCol(row, "Tp.Bt", 0);
        setCol(row, "Match.Tp.Bt", 0);
      }

      if (bowl) {
        setBowlingOvers(row, bowl.overs);
        setCol(row, "Maidens", bowl.maidens);
        setCol(row, "No Balls", bowl.noBalls);
        setBowlingWides(row, bowl.wides);
        setBowlingRuns(row, bowl.runs);
        setCol(row, "Wickets", bowl.wickets);
        setCol(row, "Top Bowl", innTopBowl && samePlayer(bowl.name, innTopBowl.name) ? 1 : 0);
        setCol(
          row,
          "Match Top Bowl",
          matchTopBowl && samePlayer(bowl.name, matchTopBowl.name) ? 1 : 0,
        );
      }

      setCol(row, "Count", 1);
      setCol(row, "C.Inns", 1);
      setCol(row, "Chase", inn.inningsNumber === 2 ? chaseTarget : null);
      setCol(row, "NoBalls", inn.extrasNoBalls);
      setExtrasWides(row, inn.extrasWides);
      setCol(row, "LegByes", inn.extrasLegByes);
      setCol(row, "Byes", inn.extrasByes);
      setExtrasBreakdown(row, inn.extras);
      setTeamOversCap(row, inn.oversCap);
      setCol(row, "PlayerID", member.cricbuzzPlayerId);
      setCol(row, "Catches", 0);

      rows.push(row);
    }
  }

  return rows;
}
