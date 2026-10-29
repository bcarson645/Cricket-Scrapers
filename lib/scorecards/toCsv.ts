import { EXPORT_CSV_HEADERS, type ExportRow } from "@/lib/scorecards/export-columns";

export function rowsToCsv(rows: ExportRow[]): string {
  const escape = (v: string | number | null | undefined): string => {
    if (v == null) return "";
    const s = String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const lines = [
    [...EXPORT_CSV_HEADERS, ""].join(","),
    ...rows.map((row) => EXPORT_CSV_HEADERS.map((_, i) => escape(row[i])).join(",") + ","),
  ];
  return `${lines.join("\r\n")}\r\n`;
}

/** @deprecated Use cricbuzzToExportRows + rowsToCsv for full sample-game columns. */
export function matchToExportRows(): never {
  throw new Error("Use cricbuzzToExportRows from lib/scrapers/sites/cricbuzz/buildExportRows");
}
