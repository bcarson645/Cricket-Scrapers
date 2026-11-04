import * as cheerio from "cheerio";
import type { CricbuzzBowlLine, CricbuzzInnings, CricbuzzParsedMatch } from "@/lib/scrapers/sites/cricbuzz/parseHtml";
import type { CrexSc4Inning } from "@/lib/scrapers/sites/crex/types";
import {
  collectCrexDidNotBatAfterMerge,
  mergeCrexPlayerMaps,
  mergeHtmlBattingIntoStints,
  parseCrexHtmlBatterCell,
  parseCrexSc4BattingStints,
  parseCrexSc4Bowling,
  type HtmlBatterRow,
} from "@/lib/scrapers/sites/crex/parseSc4Inning";
import { normalizePersonName } from "@/lib/scrapers/sites/cricbuzz/dismissal";

function parseNum(s: string): number {
  const n = Number(s.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function parseOversCell(o: string): number {
  const t = o.trim();
  if (!t.includes(".")) return parseNum(t);
  const [whole, balls] = t.split(".");
  return parseNum(whole) + parseNum(balls) / 6;
}

function parseBattingTables(html: string): HtmlBatterRow[][] {
  const $ = cheerio.load(html);
  const innings: HtmlBatterRow[][] = [];

  $("table").each((_, table) => {
    const headers = $(table)
      .find("th")
      .map((__, th) => $(th).text().trim().toLowerCase())
      .get();
    if (!headers[0]?.includes("batter") || headers[1]?.includes("score")) return;

    const rows: HtmlBatterRow[] = [];
    $(table)
      .find("tbody tr")
      .each((__, tr) => {
        const cells = $(tr)
          .find("td")
          .map((___, td) => $(td).text().trim())
          .get();
        if (cells.length < 3) return;
        const { name, dismissal } = parseCrexHtmlBatterCell(cells[0] ?? "");
        rows.push({
          name,
          dismissal,
          runs: parseNum(cells[1] ?? "0"),
          balls: parseNum(cells[2] ?? "0"),
          fours: parseNum(cells[3] ?? "0"),
          sixes: parseNum(cells[4] ?? "0"),
        });
      });
    if (rows.length) innings.push(rows);
  });

  return innings;
}

function parseBowlingTables(html: string): CricbuzzBowlLine[][] {
  const $ = cheerio.load(html);
  const out: CricbuzzBowlLine[][] = [];
  $("table").each((_, table) => {
    const headers = $(table)
      .find("th")
      .map((__, th) => $(th).text().trim().toLowerCase())
      .get();
    if (!headers[0]?.includes("bowler")) return;
    const rows: CricbuzzBowlLine[] = [];
    $(table)
      .find("tbody tr")
      .each((__, tr) => {
        const cells = $(tr)
          .find("td")
          .map((___, td) => $(td).text().trim())
          .get();
        if (cells.length < 5) return;
        rows.push({
          name: cells[0] ?? "",
          cricbuzzPlayerId: null,
          overs: parseOversCell(cells[1] ?? "0"),
          maidens: parseNum(cells[2] ?? "0"),
          runs: parseNum(cells[3] ?? "0"),
          wickets: parseNum(cells[4] ?? "0"),
          wides: 0,
          noBalls: 0,
        });
      });
    if (rows.length) out.push(rows);
  });
  return out;
}

function parseScoreSummary(d: string | undefined): { total: number; wickets: number } {
  if (!d) return { total: 0, wickets: 0 };
  const m = /^(\d+)\/(\d+)/.exec(d);
  if (m) return { total: Number(m[1]), wickets: Number(m[2]) };
  const m2 = /^(\d+)/.exec(d);
  return { total: m2 ? Number(m2[1]) : 0, wickets: 0 };
}

function formatLabel(fo: string | undefined): string {
  const t = (fo ?? "").toLowerCase();
  if (t.includes("t20")) return "T20";
  if (t.includes("one day") || t.includes("odi")) return "ODI";
  if (t.includes("test")) return "Test";
  return fo?.trim() || "T20";
}

function teamNameForFkey(
  fkey: string | undefined,
  matchBlock: { team1?: { name?: string; fkey?: string }; team2?: { name?: string; fkey?: string } },
  meta: { team1?: string; team2?: string },
  fallback1: string,
  fallback2: string,
): string {
  if (fkey && fkey === matchBlock.team1?.fkey) return matchBlock.team1.name ?? meta.team1 ?? fallback1;
  if (fkey && fkey === matchBlock.team2?.fkey) return matchBlock.team2.name ?? meta.team2 ?? fallback2;
  return fallback1;
}

function assignHtmlBatToInnings(
  htmlBat: HtmlBatterRow[][],
  sc4: CrexSc4Inning[],
): Map<number, HtmlBatterRow[]> {
  const map = new Map<number, HtmlBatterRow[]>();
  if (htmlBat.length === 0) return map;
  if (htmlBat.length === sc4.length) {
    htmlBat.forEach((rows, i) => map.set(i, rows));
    return map;
  }
  if (htmlBat.length === 1 && sc4.length >= 2) {
    map.set(sc4.length - 1, htmlBat[0]!);
    return map;
  }
  map.set(0, htmlBat[0]!);
  return map;
}

function appendBowlersOnlyToDidNotBat(
  didNotBat: string[],
  batters: { name: string }[],
  bowlers: CricbuzzBowlLine[],
): string[] {
  const seen = new Set([
    ...batters.map((b) => normalizePersonName(b.name)),
    ...didNotBat.map((n) => normalizePersonName(n)),
  ]);
  const out = [...didNotBat];
  for (const bowl of bowlers) {
    const norm = normalizePersonName(bowl.name);
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push(bowl.name);
  }
  return out;
}

export function parseCrexScorecardPayload(options: {
  html: string;
  state: Record<string, unknown>;
  matchFkey: string;
}): CricbuzzParsedMatch {
  const state = options.state;
  const metaList = state["https://stats.crickapi.com/live/getMatchMetaData"] as
    | { team1?: string; team2?: string; v?: string; t?: string; fo?: string }[]
    | undefined;
  const meta = metaList?.[0] ?? {};
  const matchKey = `match-${options.matchFkey}`;
  const matchBlock = (state[matchKey] ?? {}) as {
    team1?: { name?: string; fkey?: string };
    team2?: { name?: string; fkey?: string };
    v?: string;
    t?: string;
  };

  const team1 = matchBlock.team1?.name ?? meta.team1 ?? "Team 1";
  const team2 = matchBlock.team2?.name ?? meta.team2 ?? "Team 2";
  const venue = matchBlock.v ?? meta.v ?? null;
  const startIso = matchBlock.t ?? meta.t;
  let dateDisplay: string | null = null;
  if (startIso) {
    const d = new Date(startIso);
    if (!Number.isNaN(d.getTime())) {
      dateDisplay = `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
    }
  }

  const players = mergeCrexPlayerMaps(state);
  const sc4 = (state["https://api.goscorer.com/api/v3/getSC4"] ?? []) as CrexSc4Inning[];
  const htmlBat = parseBattingTables(options.html);
  const htmlBowl = parseBowlingTables(options.html);
  const htmlBatByInning = assignHtmlBatToInnings(htmlBat, sc4);

  const innings: CricbuzzInnings[] = [];
  for (let i = 0; i < sc4.length; i++) {
    const inn = sc4[i]!;
    const battingTeam = teamNameForFkey(inn.c, matchBlock, meta, team1, team2);
    const opponent =
      battingTeam === team1 || battingTeam === meta.team1
        ? team2
        : team1;
    const summary = parseScoreSummary(inn.d);

    const { batters: stints, didNotBat: dnbFromStints } = parseCrexSc4BattingStints(inn, players);
    const htmlRows = htmlBatByInning.get(i) ?? [];
    const merged = mergeHtmlBattingIntoStints(stints, htmlRows);
    let didNotBat = collectCrexDidNotBatAfterMerge(inn, players, merged, dnbFromStints);

    let bowlers = parseCrexSc4Bowling(inn, players);
    if (bowlers.length === 0 && htmlBowl[0] && i === sc4.length - 1) {
      bowlers = htmlBowl[0];
    }
    if (bowlers.length === 0 && htmlBowl[i]) {
      bowlers = htmlBowl[i]!;
    }

    innings.push({
      inningsNumber: i + 1,
      teamBattingInningsIndex: 1,
      teamName: battingTeam,
      opponentName: opponent,
      total: summary.total,
      wickets: summary.wickets,
      extras: 0,
      extrasByes: 0,
      extrasLegByes: 0,
      extrasWides: 0,
      extrasNoBalls: 0,
      oversCap: 20,
      batters: merged.map((b, idx) => ({
        order: idx + 1,
        name: b.name,
        cricbuzzPlayerId: b.playerKey,
        dismissalRaw: b.dismissalRaw,
        runs: b.runs,
        balls: b.balls,
        fours: b.fours,
        sixes: b.sixes,
      })),
      didNotBat,
      bowlers,
    });
  }

  for (let i = 0; i < innings.length; i++) {
    const battingInn = innings[i]!;
    const opponentInn = innings[i === 0 ? 1 : 0];
    if (!opponentInn) continue;
    const ourBowlersWhenFielding = opponentInn.bowlers;
    battingInn.didNotBat = appendBowlersOnlyToDidNotBat(
      battingInn.didNotBat,
      battingInn.batters,
      ourBowlersWhenFielding,
    );
  }

  if (innings.length === 0) {
    throw new Error("Crex scorecard JSON (getSC4) has no innings");
  }

  return {
    cricbuzzMatchId: options.matchFkey,
    dateDisplay,
    formatLabel: formatLabel(meta.fo),
    maxOvers: innings[0]?.oversCap ?? 20,
    venue,
    host: null,
    title: `${team1} vs ${team2}`,
    innings,
    squads: {},
  };
}
