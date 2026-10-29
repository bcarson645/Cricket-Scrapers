import { EXPORT_CSV_HEADERS, type ExportRow } from "@/lib/scorecards/export-columns";

export function colIndex(name: string, occurrence = 0): number {
  let n = 0;
  for (let i = 0; i < EXPORT_CSV_HEADERS.length; i++) {
    if (EXPORT_CSV_HEADERS[i] === name) {
      if (n === occurrence) return i;
      n++;
    }
  }
  return -1;
}

export function cell(row: ExportRow, name: string, occurrence = 0): string | number | null {
  const i = colIndex(name, occurrence);
  if (i < 0) return null;
  const v = row[i];
  return v ?? null;
}

export function cellStr(row: ExportRow, name: string, occurrence = 0): string {
  const v = cell(row, name, occurrence);
  if (v == null || v === "") return "—";
  return String(v);
}

/** Second "Runs" column = bowling runs conceded. */
export function bowlingRuns(row: ExportRow): string | number | null {
  const i = colIndex("Runs", 1);
  return i >= 0 ? (row[i] ?? null) : null;
}
