import type { ExportRow } from "@/lib/scorecards/export-columns";
import { compareExportDates } from "@/lib/scrapers/sites/cricbuzz/discoverRecent";
import { cell } from "@/lib/scorecards/rowAccess";

export type ScoredMatchRows = {
  cricbuzzMatchId: string;
  date: string | null;
  rows: ExportRow[];
};

/** Oldest date first; rows for each match stay grouped. */
export function mergeExportRowsByDate(matches: ScoredMatchRows[]): ExportRow[] {
  const sorted = [...matches].sort((a, b) => {
    const da = a.date ?? cell(a.rows[0], "Date")?.toString() ?? null;
    const db = b.date ?? cell(b.rows[0], "Date")?.toString() ?? null;
    const cmp = compareExportDates(da, db);
    if (cmp !== 0) return cmp;
    return a.cricbuzzMatchId.localeCompare(b.cricbuzzMatchId);
  });
  return sorted.flatMap((m) => m.rows);
}
