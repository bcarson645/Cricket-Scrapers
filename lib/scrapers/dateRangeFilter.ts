import { exportDateToSortKey } from "@/lib/scrapers/sites/cricbuzz/discoverListings";

export function parseIsoDateParam(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const v = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  return v;
}

export function localIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function defaultYearToDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getFullYear(), 0, 1);
  return { from: localIsoDate(from), to: localIsoDate(to) };
}

function isoToSortKey(iso: string): number {
  const [y, mo, d] = iso.split("-").map((p) => Number(p));
  if (!y || !mo || !d) return 0;
  return y * 10000 + mo * 100 + d;
}

/** Match dates stored as M/D/YYYY (Cricbuzz / Cricinfo export display). */
export function exportDisplayDateInRange(
  matchDate: string | null | undefined,
  fromIso: string,
  toIso: string,
): boolean {
  if (!matchDate) return false;
  const key = exportDateToSortKey(matchDate);
  if (key <= 0) return false;
  return key >= isoToSortKey(fromIso) && key <= isoToSortKey(toIso);
}

export function utcIsoStartInRange(
  startIso: string | null | undefined,
  fromIso: string,
  toIso: string,
): boolean {
  if (!startIso) return false;
  const day = startIso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  return day >= fromIso && day <= toIso;
}

export function parseLocalIsoDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return new Date(y, mo - 1, d);
}

export function formatRangeDate(iso: string): string {
  const d = parseLocalIsoDate(iso);
  if (!d) return iso;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function inclusiveDayCount(from: string, to: string): number | null {
  const a = parseLocalIsoDate(from);
  const b = parseLocalIsoDate(to);
  if (!a || !b || a > b) return null;
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000)) + 1;
}

/** Inclusive list of YYYY-MM-DD from `from` through `to`. */
export function eachIsoDateInRange(from: string, to: string): string[] {
  const start = parseLocalIsoDate(from);
  const end = parseLocalIsoDate(to);
  if (!start || !end || start > end) return [];
  const days: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(localIsoDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

/** Cricinfo results page expects DD-MM-YYYY in the `date` query param. */
export function isoToCricinfoResultsDateParam(iso: string): string {
  const [y, mo, d] = iso.split("-");
  return `${d}-${mo}-${y}`;
}

export type SeriesOption = {
  seriesId: number;
  seriesName: string;
  matchCount: number;
};

export type MatchWithSeriesId = {
  seriesId: number;
  seriesName: string;
};

export function groupSeriesOptions(
  rows: { seriesId: number; seriesName: string }[],
): SeriesOption[] {
  const map = new Map<number, { name: string; count: number }>();
  for (const row of rows) {
    const prev = map.get(row.seriesId);
    if (prev) prev.count += 1;
    else map.set(row.seriesId, { name: row.seriesName, count: 1 });
  }
  return [...map.entries()]
    .map(([seriesId, { name, count }]) => ({
      seriesId,
      seriesName: name,
      matchCount: count,
    }))
    .sort((a, b) => a.seriesName.localeCompare(b.seriesName));
}
