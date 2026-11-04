import { normalizePersonName } from "@/lib/scrapers/sites/cricbuzz/dismissal";
import type { CricbuzzBowlLine } from "@/lib/scrapers/sites/cricbuzz/parseHtml";
import type { CrexSc4Inning } from "@/lib/scrapers/sites/crex/types";

export function crexPlayerKeyFromEncoded(raw: string): string {
  const trimmed = raw.trim();
  if (isCrexDidNotBatLine(trimmed)) return trimmed.replace(/\/.*$/, "");
  return trimmed.split(".")[0] ?? trimmed;
}

/** Lines like `M6I/-/` or `QC6/-` — player in XI who did not bat. */
export function isCrexDidNotBatLine(raw: string): boolean {
  return /^[^./]+\/-\/?$/.test(raw.trim());
}

export type CrexParsedBatter = {
  playerKey: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  dismissalRaw: string;
};

export function mergeCrexPlayerMaps(state: Record<string, unknown>): Map<string, string> {
  const map = new Map<string, string>();
  for (const [key, val] of Object.entries(state)) {
    if (!key.includes("getHomeMapData")) continue;
    const block = val as { p?: { f_key?: string; n?: string }[] } | undefined;
    for (const row of block?.p ?? []) {
      const k = row.f_key?.trim();
      const n = row.n?.trim();
      if (k && n) map.set(k, n);
    }
  }
  return map;
}

/** One `b` line in getSC4 is a batting stint ending at a wicket (or innings end). */
export function parseCrexSc4BattingStints(
  inn: CrexSc4Inning,
  players: Map<string, string>,
): { batters: CrexParsedBatter[]; didNotBat: string[] } {
  const batters: CrexParsedBatter[] = [];
  const didNotBat: string[] = [];
  const seenKeys = new Set<string>();

  for (const raw of inn.b ?? []) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    if (isCrexDidNotBatLine(trimmed)) {
      const key = crexPlayerKeyFromEncoded(trimmed);
      if (key && !seenKeys.has(key)) {
        didNotBat.push(players.get(key) ?? key);
        seenKeys.add(key);
      }
      continue;
    }

    const parts = trimmed.split(".");
    if (parts.length >= 5 && parts.length < 9) {
      const playerKey = parts[0] ?? "";
      if (playerKey && !seenKeys.has(playerKey)) {
        seenKeys.add(playerKey);
        const sixPart = parts[4] ?? "";
        batters.push({
          playerKey,
          name: players.get(playerKey) ?? playerKey,
          runs: Number(parts[1]) || 0,
          balls: Number(parts[2]) || 0,
          fours: Number(parts[3]) || 0,
          sixes: Number(String(sixPart).replace(/\/.*/, "")) || 0,
          dismissalRaw: /\/-\//.test(trimmed) || /\/-$/.test(trimmed) ? "not out" : "not out",
        });
      }
      continue;
    }

    if (parts.length < 9) continue;

    const playerKey = parts[0] ?? "";
    if (!playerKey || seenKeys.has(playerKey)) continue;
    seenKeys.add(playerKey);

    const bowlerKey = (parts[8] ?? "").replace(/\/.*$/, "");
    const fielderKey = (parts[9] ?? "").replace(/\/-\/$/, "").replace(/\/.*$/, "");

    batters.push({
      playerKey,
      name: players.get(playerKey) ?? playerKey,
      runs: Number(parts[1]) || 0,
      balls: Number(parts[2]) || 0,
      fours: Number(parts[3]) || 0,
      sixes: Number(parts[4]) || 0,
      dismissalRaw: formatCrexDismissal(bowlerKey, fielderKey, players),
    });
  }

  return { batters, didNotBat };
}

/** DNB markers in getSC4 `b` that are dropped when HTML batting tables are merged in. */
export function collectCrexDidNotBatAfterMerge(
  inn: CrexSc4Inning,
  players: Map<string, string>,
  mergedBatters: CrexParsedBatter[],
  priorDidNotBat: string[],
): string[] {
  const batterNorms = new Set(mergedBatters.map((b) => normalizePersonName(b.name)));
  const seen = new Set<string>();
  const out: string[] = [];
  const pushDnb = (name: string) => {
    const n = name.trim();
    if (!n) return;
    const norm = normalizePersonName(n);
    if (batterNorms.has(norm) || seen.has(norm)) return;
    seen.add(norm);
    out.push(n);
  };

  for (const name of priorDidNotBat) pushDnb(name);

  for (const raw of inn.b ?? []) {
    if (!isCrexDidNotBatLine(raw)) continue;
    const playerKey = crexPlayerKeyFromEncoded(raw);
    const name = players.get(playerKey) ?? playerKey;
    const norm = normalizePersonName(name);
    const inMerged = mergedBatters.some(
      (b) => b.playerKey === playerKey || normalizePersonName(b.name) === norm,
    );
    if (!inMerged) pushDnb(name);
  }

  return out;
}

/** `a` lines are bowling figures for the fielding side in this innings. */
export function parseCrexSc4Bowling(inn: CrexSc4Inning, players: Map<string, string>): CricbuzzBowlLine[] {
  const rows: CricbuzzBowlLine[] = [];
  for (const encoded of inn.a ?? []) {
    const parts = encoded.split(".");
    if (parts.length < 5) continue;
    const key = parts[0] ?? "";
    const runs = Number(parts[1]) || 0;
    const balls = Number(parts[2]) || 0;
    const maidens = Number(parts[3]) || 0;
    const wickets = Number(parts[4]) || 0;
    rows.push({
      name: players.get(key) ?? key,
      cricbuzzPlayerId: key,
      overs: balls / 6,
      maidens,
      runs,
      wickets,
      wides: 0,
      noBalls: 0,
    });
  }
  return rows;
}

function formatCrexDismissal(
  bowlerKey: string,
  fielderKey: string,
  players: Map<string, string>,
): string {
  const bowler = players.get(bowlerKey) ?? bowlerKey;
  const fielder = players.get(fielderKey) ?? fielderKey;
  if (!bowlerKey) return "not out";
  if (fielderKey && fielderKey === bowlerKey) return `c&b ${bowler}`;
  if (fielderKey && fielderKey !== "-") return `c ${fielder} b ${bowler}`;
  return `b ${bowler}`;
}

export type HtmlBatterRow = {
  name: string;
  dismissal: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
};

export function parseCrexHtmlBatterCell(first: string): { name: string; dismissal: string } {
  const cleaned = first.replace(/\s+/g, " ").trim();
  if (/not out/i.test(cleaned)) {
    return {
      name: cleaned.replace(/\(C\)|\(WK\)/gi, "").replace(/\s*not out\s*/i, "").trim(),
      dismissal: "not out",
    };
  }
  const patterns: RegExp[] = [
    /^(.+?)\s+(run out\s*\([^)]+\))/i,
    /^(.+?)\s+(c&b\s.+)$/i,
    /^(.+?)\s+(c\s.+ b\s.+)$/i,
    /^(.+?)\s+(lbw\s.+)$/i,
    /^(.+?)\s+(st\s.+ b\s.+)$/i,
    /^(.+?)\s+(b\s.+)$/i,
  ];
  for (const p of patterns) {
    const m = cleaned.match(p);
    if (m) {
      return {
        name: m[1].replace(/\(C\)|\(WK\)/gi, "").trim(),
        dismissal: m[2].trim(),
      };
    }
  }
  return {
    name: cleaned.replace(/\(C\)|\(WK\)/gi, "").trim(),
    dismissal: "not out",
  };
}

/** Prefer HTML batting rows when SSR includes a full scorecard table for this innings. */
export function mergeHtmlBattingIntoStints(
  stints: CrexParsedBatter[],
  htmlRows: HtmlBatterRow[],
): CrexParsedBatter[] {
  if (htmlRows.length === 0) return stints;
  if (htmlRows.length < stints.length) return stints;

  const byName = new Map(stints.map((s) => [s.name.toLowerCase(), s]));
  const out: CrexParsedBatter[] = [];
  for (const row of htmlRows) {
    const prev = byName.get(row.name.toLowerCase());
    out.push({
      playerKey: prev?.playerKey ?? row.name,
      name: row.name,
      runs: row.runs,
      balls: row.balls,
      fours: row.fours,
      sixes: row.sixes,
      dismissalRaw: row.dismissal,
    });
  }
  return out;
}
