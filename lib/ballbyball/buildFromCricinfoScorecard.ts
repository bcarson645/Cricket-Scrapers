import type { CricinfoAppPageData } from "@/lib/scrapers/sites/cricinfo/fetchPageData";
import {
  BALL_BY_BALL_CSV_HEADERS,
  emptyBallByBallRow,
  setBallCol,
  type BallByBallRow,
} from "@/lib/ballbyball/export-columns";

type CiPlayerRef = {
  id?: number;
  objectId?: number;
  battingName?: string;
  longName?: string;
  fieldingName?: string;
};

type CiBall = {
  inningNumber?: number;
  oversActual?: number;
  overNumber?: number;
  ballNumber?: number;
  totalRuns?: number;
  batsmanRuns?: number;
  isFour?: boolean;
  isSix?: boolean;
  isWicket?: boolean;
  dismissalType?: number | null;
  byes?: number;
  legbyes?: number;
  wides?: number;
  noballs?: number;
  batsmanPlayerId?: number;
  nonStrikerPlayerId?: number;
  bowlerPlayerId?: number;
  outPlayerId?: number | null;
  totalInningRuns?: number;
  totalInningWickets?: number;
  batsmanStatText?: { statInfo?: string; short?: string; long?: string };
  bowlerStatText?: { short?: string; long?: string };
  dismissalText?: { short?: string; long?: string } | null;
  title?: string;
};

type CiOver = {
  overNumber?: number;
  overRuns?: number;
  overWickets?: number;
  isComplete?: boolean;
  balls?: CiBall[];
  bowlers?: CiPlayerRef[];
};

type CiInning = {
  inningNumber?: number;
  team?: { id?: number; longName?: string; name?: string };
  runs?: number;
  target?: number;
  inningBatsmen?: { player?: CiPlayerRef }[];
  inningBowlers?: { player?: CiPlayerRef }[];
  inningOvers?: CiOver[];
};

const DISMISSAL_LABEL: Record<number, string> = {
  1: "bowled",
  2: "caught",
  3: "lbw",
  4: "run out",
  5: "stumped",
  6: "hit wicket",
  7: "handled the ball",
  8: "obstructing the field",
  9: "timed out",
  10: "retired out",
  11: "hit the ball twice",
};

function playerName(p: CiPlayerRef | undefined): string {
  const batting = (p?.battingName ?? "").trim();
  const long = (p?.longName ?? "").trim();
  const fielding = (p?.fieldingName ?? "").trim();
  if (batting && long && /^[A-Z]{1,2}\.?\s+\S/.test(batting) && long.length > batting.length + 2) {
    return long;
  }
  return batting || long || fielding;
}

function teamLongName(entry: { team?: { longName?: string; name?: string } }): string {
  return entry.team?.longName ?? entry.team?.name ?? "Team";
}

function parseMatchDate(match: Record<string, unknown>): string | null {
  const raw = match.startDate as string | undefined;
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
}

function formatDeliv(oversActual: number | undefined): string | null {
  if (oversActual == null) return null;
  const s = String(oversActual);
  if (!s.includes(".")) return `${s}.0`;
  return s;
}

function parseBatsmanStat(statInfo: string | undefined): { runs: number; balls: number } | null {
  if (!statInfo) return null;
  const m = statInfo.match(/(\d+)\*?\s*\((\d+)b\)/);
  if (!m) return null;
  return { runs: Number(m[1]), balls: Number(m[2]) };
}

/** Reference export uses empty cells when false (not the string FALSE). */
function boolCsv(v: boolean): string {
  return v ? "TRUE" : "";
}

function buildPlayerIdMap(innings: CiInning[]): Map<number, string> {
  const map = new Map<number, string>();
  const add = (p: CiPlayerRef | undefined) => {
    if (p?.id == null) return;
    const name = playerName(p);
    if (name) map.set(p.id, name);
  };
  for (const inn of innings) {
    for (const b of inn.inningBatsmen ?? []) add(b.player);
    for (const b of inn.inningBowlers ?? []) add(b.player);
    for (const ov of inn.inningOvers ?? []) {
      for (const bw of ov.bowlers ?? []) add(bw);
    }
  }
  return map;
}

function nameForId(map: Map<number, string>, id: number | undefined): string | null {
  if (id == null) return null;
  return map.get(id) ?? null;
}

function parseTitle(title: string | undefined): { bowler: string | null; batsman: string | null } {
  if (!title) return { bowler: null, batsman: null };
  const m = title.match(/^(.+?)\s+to\s+(.+)$/i);
  if (!m) return { bowler: null, batsman: null };
  return { bowler: m[1].trim(), batsman: m[2].trim() };
}

function computeOverAggregates(balls: CiBall[]): Map<string, { overRuns: number; overWickets: number }> {
  const map = new Map<string, { overRuns: number; overWickets: number }>();
  for (const ball of balls) {
    const key = `${ball.inningNumber ?? 0}-${ball.overNumber ?? 0}`;
    const cur = map.get(key) ?? { overRuns: 0, overWickets: 0 };
    cur.overRuns += ball.totalRuns ?? 0;
    if (ball.isWicket) cur.overWickets += 1;
    map.set(key, cur);
  }
  return map;
}

function wicketTypeLabel(ball: CiBall): string | null {
  if (!ball.isWicket) return null;
  const short = ball.dismissalText?.short;
  if (short) return short.toLowerCase();
  if (ball.dismissalType != null && DISMISSAL_LABEL[ball.dismissalType]) {
    return DISMISSAL_LABEL[ball.dismissalType];
  }
  return null;
}

function collectBallsFromInnings(innings: CiInning[]): CiBall[] {
  const out: CiBall[] = [];
  for (const inn of innings) {
    for (const ov of inn.inningOvers ?? []) {
      for (const ball of ov.balls ?? []) out.push(ball);
    }
  }
  return out;
}

function overMetaForBall(ball: CiBall, innings: CiInning[]): {
  overRuns: number;
  overWickets: number;
  isComplete: boolean;
  bowlerName: string | null;
} {
  const inn = innings.find((i) => i.inningNumber === ball.inningNumber);
  const ov = inn?.inningOvers?.find((o) => o.overNumber === ball.overNumber);
  return {
    overRuns: ov?.overRuns ?? 0,
    overWickets: ov?.overWickets ?? 0,
    isComplete: Boolean(ov?.isComplete),
    bowlerName: ov?.bowlers?.[0] ? playerName(ov.bowlers[0]) : null,
  };
}

export function buildBallByBallFromCricinfoScorecard(
  page: CricinfoAppPageData,
  matchObjectId: string,
  externalBalls?: CiBall[],
): BallByBallRow[] {
  const match = page.match;
  const content = page.content as { innings?: CiInning[] };
  const innings = content.innings ?? [];
  const teams = (match.teams as { team?: { longName?: string; name?: string } }[]) ?? [];
  /** Reference files use team1/team2 in reverse of Cricinfo `match.teams` order for this feed. */
  const team1 = teams[1] ? teamLongName(teams[1]) : teams[0] ? teamLongName(teams[0]) : "";
  const team2 = teams[0] ? teamLongName(teams[0]) : teams[1] ? teamLongName(teams[1]) : "";
  const series = match.series as { longName?: string; name?: string } | undefined;
  const competition = series?.longName ?? series?.name ?? "T20";
  const ground = match.ground as {
    name?: string;
    country?: { name?: string };
  };
  const venue = ground?.name ?? null;
  const host = ground?.country?.name ?? null;
  const date = parseMatchDate(match);
  const playerMap = buildPlayerIdMap(innings);

  const firstInningsRuns = innings.find((i) => i.inningNumber === 1)?.runs ?? 0;
  const chaseTarget = firstInningsRuns > 0 ? firstInningsRuns + 1 : null;

  const rows: BallByBallRow[] = [];

  const ballsByInning = new Map<number, CiBall[]>();
  const sourceBalls = externalBalls?.length ? externalBalls : collectBallsFromInnings(innings);
  for (const ball of sourceBalls) {
    const innNum = ball.inningNumber ?? 1;
    const list = ballsByInning.get(innNum) ?? [];
    list.push(ball);
    ballsByInning.set(innNum, list);
  }
  for (const [, list] of ballsByInning) {
    list.sort((a, b) => (a.oversActual ?? 0) - (b.oversActual ?? 0));
  }

  for (const inn of innings) {
    const innNum = inn.inningNumber ?? 1;
    const battingTeamName = teamLongName(inn);
    const target =
      innNum === 1 ? (inn.target === 0 ? 0 : null) : (inn.target ?? chaseTarget);
    const ballsInInnings = ballsByInning.get(innNum) ?? [];
    const overAgg = computeOverAggregates(ballsInInnings);
    let legalBallsBowled = 0;
    const batterStats = new Map<number, { runs: number; balls: number; fours: number; sixes: number }>();

    for (const ball of ballsInInnings) {
      const scored = overMetaForBall(ball, innings);
      const agg = overAgg.get(`${ball.inningNumber ?? 0}-${ball.overNumber ?? 0}`);
      const over = {
        overRuns: scored.overRuns || agg?.overRuns || 0,
        overWickets: scored.overWickets || agg?.overWickets || 0,
        isComplete: scored.isComplete,
        bowlerName: scored.bowlerName,
      };
      const row = emptyBallByBallRow();
      const wide = (ball.wides ?? 0) > 0;
      const noBall = (ball.noballs ?? 0) > 0;
      const byes = (ball.byes ?? 0) > 0;
      const legByes = (ball.legbyes ?? 0) > 0;
      const isWicket = Boolean(ball.isWicket);

      let ballsRem = Math.max(0, 120 - legalBallsBowled);
      if (wide || noBall) {
        ballsRem = Math.min(120, ballsRem + 1);
      }
      if (!wide && !noBall) {
        legalBallsBowled += 1;
      }

      const strikerId = ball.batsmanPlayerId;
      const nonStrikerId = ball.nonStrikerPlayerId;
      if (strikerId != null) {
        const cur = batterStats.get(strikerId) ?? { runs: 0, balls: 0, fours: 0, sixes: 0 };
        if (!wide && !noBall) cur.balls += 1;
        cur.runs += ball.batsmanRuns ?? 0;
        if (ball.isFour) cur.fours += 1;
        if (ball.isSix) cur.sixes += 1;
        batterStats.set(strikerId, cur);
      }

      const parsedStriker = parseBatsmanStat(ball.batsmanStatText?.statInfo);
      const strikerName =
        nameForId(playerMap, strikerId) ?? parseTitle(ball.title)?.batsman;
      const nonStrikerName = nameForId(playerMap, nonStrikerId);
      const bowlerName =
        nameForId(playerMap, ball.bowlerPlayerId) ?? over.bowlerName ?? parseTitle(ball.title)?.bowler;

      const stStats = strikerId != null ? batterStats.get(strikerId) : undefined;
      const nsStats = nonStrikerId != null ? batterStats.get(nonStrikerId) : undefined;

      const deliv = formatDeliv(ball.oversActual);
      const maiden =
        Boolean(over.isComplete) &&
        (over.overRuns ?? 0) === 0 &&
        (over.overWickets ?? 0) === 0;
      const bowlerWicket =
        isWicket && ball.dismissalType !== 4 && ball.dismissalType !== 8;

      setBallCol(row, "matchID", matchObjectId);
      setBallCol(row, "date", date);
      setBallCol(row, "competition", competition);
      setBallCol(row, "team1", team1);
      setBallCol(row, "team2", team2);
      setBallCol(row, "venue", venue);
      setBallCol(row, "host", host);
      setBallCol(row, "battingTeamName", battingTeamName);
      setBallCol(row, "innings", innNum);
      setBallCol(row, "ballRuns", ball.totalRuns ?? 0);
      setBallCol(row, "ballWkt", isWicket ? 1 : 0);
      setBallCol(row, "cumRuns", ball.totalInningRuns ?? 0);
      setBallCol(row, "cumWkts", ball.totalInningWickets ?? 0);
      setBallCol(row, "bowlerName", bowlerName);
      setBallCol(row, "batsmanName", strikerName);
      setBallCol(
        row,
        "bat1CumulativeRuns",
        parsedStriker?.runs ?? stStats?.runs ?? 0,
      );
      setBallCol(
        row,
        "bat1CumulativeBalls",
        parsedStriker?.balls ?? stStats?.balls ?? 0,
      );
      setBallCol(row, "bat1CumulativeFours", stStats?.fours ?? 0);
      setBallCol(row, "bat1CumulativeSixes", stStats?.sixes ?? 0);
      setBallCol(row, "otherBatsmanName", nonStrikerName);
      setBallCol(row, "bat2CumulativeRuns", nsStats?.runs ?? 0);
      setBallCol(row, "bat2CumulativeBalls", nsStats?.balls ?? 0);
      setBallCol(row, "bat2CumulativeFours", nsStats?.fours ?? 0);
      setBallCol(row, "bat2CumulativeSixes", nsStats?.sixes ?? 0);
      setBallCol(row, "ballsRem", ballsRem);
      setBallCol(row, "target", innNum === 1 ? (target === 0 ? 0 : null) : target);
      setBallCol(row, "ballNumber", ball.ballNumber ?? null);
      setBallCol(row, "overNumber", ball.overNumber ?? null);
      setBallCol(row, "powerSurge", boolCsv(false));
      setBallCol(row, "maiden", boolCsv(maiden));
      setBallCol(row, "noBall", noBall ? 1 : 0);
      setBallCol(row, "wide", wide ? 1 : 0);
      setBallCol(row, "byes", byes ? 1 : 0);
      setBallCol(row, "legByes", legByes ? 1 : 0);
      setBallCol(row, "overWickets", over.overWickets ?? 0);
      setBallCol(row, "overRuns", over.overRuns ?? 0);
      setBallCol(row, "ball", deliv);
      setBallCol(row, "deliv", deliv);
      setBallCol(row, "ballWicket", boolCsv(isWicket));
      setBallCol(row, "bowlerWicket", boolCsv(bowlerWicket));
      const wType = wicketTypeLabel(ball);
      setBallCol(row, "wicketType", wType);
      setBallCol(row, "wicketBowler", isWicket ? bowlerName : null);
      setBallCol(
        row,
        "wicketBatsman",
        isWicket ? nameForId(playerMap, ball.outPlayerId ?? strikerId) : null,
      );

      rows.push(row);
    }
  }

  return rows;
}

export function ballByBallRowsToTsv(rows: BallByBallRow[]): string {
  const escape = (v: string | number | null | undefined): string => {
    if (v == null) return "";
    const s = String(v);
    if (/[\t\n\r]/.test(s)) return s.replace(/\t/g, " ");
    return s;
  };
  const lines = [
    BALL_BY_BALL_CSV_HEADERS.join("\t"),
    ...rows.map((row) => row.map((c) => escape(c)).join("\t")),
  ];
  return `${lines.join("\n")}\n`;
}
