import { cell, cellStr } from "@/lib/scorecards/rowAccess";
import type { ExportRow } from "@/lib/scorecards/export-columns";
import type { CricbuzzParsedMatch } from "@/lib/scrapers/sites/cricbuzz/parseHtml";
import { isMultiInningsMatch } from "@/lib/scrapers/sites/cricbuzz/parseHtml";

export type QaPlayerRow = {
  order: string;
  name: string;
  dismissal: string;
  runs: string;
  balls: string;
  fours: string;
  sixes: string;
  bowlOvers: string;
  bowlMaidens: string;
  bowlRuns: string;
  bowlWickets: string;
};

export type QaInningsBlock = {
  inningsNumber: number;
  team: string;
  opponent: string;
  total: string;
  wickets: string;
  extras: string;
  players: QaPlayerRow[];
};

export type ScorecardQaView = {
  matchLabel: string;
  date: string;
  format: string;
  venue: string;
  host: string;
  maxOvers: string;
  rowCount: number;
  innings: QaInningsBlock[];
};

function playerFromExportRow(row: ExportRow): QaPlayerRow {
  const br = cell(row, "Runs", 1);
  return {
    order: cellStr(row, "Order"),
    name: cellStr(row, "Name"),
    dismissal: cellStr(row, "Dismissal"),
    runs: cellStr(row, "Runs"),
    balls: cellStr(row, "Balls"),
    fours: cellStr(row, "Fours"),
    sixes: cellStr(row, "Sixes"),
    bowlOvers: cellStr(row, "Overs"),
    bowlMaidens: cellStr(row, "Maidens"),
    bowlRuns: br == null || br === "" ? "—" : String(br),
    bowlWickets: cellStr(row, "Wickets"),
  };
}

/** Pure builder for QA UI from API scrape result. */
export function buildScorecardQaView(
  parsed: CricbuzzParsedMatch,
  rows: ExportRow[],
): ScorecardQaView {
  const first = rows[0];
  const inningsBlocks: QaInningsBlock[] = parsed.innings.map((inn) => {
    const exportInns = isMultiInningsMatch(parsed)
      ? inn.teamBattingInningsIndex
      : inn.inningsNumber;
    const innRows = rows.filter((r) => {
      const t = cell(r, "Team");
      const n = cell(r, "Inns");
      return String(t) === inn.teamName && Number(n) === exportInns;
    });
    const sample = innRows[0];
    return {
      inningsNumber: inn.inningsNumber,
      team: inn.teamName,
      opponent: inn.opponentName,
      total: sample ? cellStr(sample, "Total") : String(inn.total),
      wickets: sample ? cellStr(sample, "Wkts") : String(inn.wickets),
      extras: sample ? cellStr(sample, "Extras") : String(inn.extras),
      players: innRows.map(playerFromExportRow),
    };
  });

  return {
    matchLabel: parsed.title ?? `Match ${parsed.cricbuzzMatchId}`,
    date: first ? cellStr(first, "Date") : (parsed.dateDisplay ?? "—"),
    format: first ? cellStr(first, "Format") : (parsed.formatLabel ?? "—"),
    venue: first ? cellStr(first, "Venue") : (parsed.venue ?? "—"),
    host: first ? cellStr(first, "Host") : (parsed.host ?? "—"),
    maxOvers: first ? cellStr(first, "Max") : String(parsed.maxOvers ?? "—"),
    rowCount: rows.length,
    innings: inningsBlocks,
  };
}
