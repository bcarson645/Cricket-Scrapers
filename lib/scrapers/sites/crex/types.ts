export type CrexFixtureRow = {
  t1f?: string;
  t2f?: string;
  sf?: string;
  tt?: number;
  date?: string;
  t?: number;
  mn?: string;
  mt?: number;
  mf?: string;
  id?: number;
  ft?: number;
  fo?: string;
  st?: number;
  status?: number;
  s1?: string;
  s2?: string;
  o1?: string;
  o2?: string;
  team1?: string;
  team2?: string;
  t1SName?: string;
  t2SName?: string;
  n?: string;
  seriesShortName?: string;
  venue?: string;
  result?: string;
  link?: string;
  team1fkey?: string;
  team2fkey?: string;
  matchNums?: string;
  formats?: string;
};

export type CrexPlayerMapRow = { f_key?: string; n?: string };

export type CrexSc4Inning = {
  a?: string[];
  b?: string[];
  c?: string;
  d?: string;
  e?: string;
};

export function crexMdDateToExportDate(mdY: string | undefined): string | null {
  if (!mdY?.trim()) return null;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(mdY.trim());
  if (!m) return null;
  return `${Number(m[1])}/${Number(m[2])}/${m[3]}`;
}

export function crexFixtureTitle(row: CrexFixtureRow): string {
  const t1 = row.team1?.trim() || row.t1SName?.trim() || row.t1f || "Team 1";
  const t2 = row.team2?.trim() || row.t2SName?.trim() || row.t2f || "Team 2";
  const label = row.matchNums?.trim() || (row.mn ? `${row.mn}${ordinalSuffix(row.mn)}` : "");
  const fmt = row.fo?.trim() || row.formats?.trim() || "";
  const bits = [`${t1} vs ${t2}`, label, fmt].filter(Boolean);
  return bits.join(", ");
}

function ordinalSuffix(mn: string): string {
  const n = Number(mn);
  if (!Number.isFinite(n)) return "";
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  const mod10 = n % 10;
  if (mod10 === 1) return "st";
  if (mod10 === 2) return "nd";
  if (mod10 === 3) return "rd";
  return "th";
}

export function crexMatchHasScorecard(row: CrexFixtureRow): boolean {
  if (row.s1?.trim() || row.s2?.trim()) return true;
  if (row.status === 2 || row.ft === 2) return true;
  return false;
}

export function crexPlayerNameMap(
  rows: CrexPlayerMapRow[] | undefined,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows ?? []) {
    const key = row.f_key?.trim();
    const name = row.n?.trim();
    if (key && name) map.set(key, name);
  }
  return map;
}

export function parseSc4BatLine(
  encoded: string,
  players: Map<string, string>,
): { name: string; runs: number; balls: number; fours: number; sixes: number } | null {
  const parts = encoded.split(".");
  if (parts.length < 5) return null;
  const key = parts[0];
  const name = players.get(key) ?? key;
  return {
    name,
    runs: Number(parts[1]) || 0,
    balls: Number(parts[2]) || 0,
    fours: Number(parts[3]) || 0,
    sixes: Number(parts[4]) || 0,
  };
}
