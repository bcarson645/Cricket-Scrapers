/** Exact header row from sample game export (duplicate names preserved). */
export const EXPORT_CSV_HEADERS = [
  "ID",
  "Date",
  "Format",
  "Max",
  "Venue",
  "Host",
  "Team",
  "Opps",
  "Inns",
  "Total",
  "Wkts",
  "Extras",
  "Order",
  "Name",
  "Dismissal",
  "Runs",
  "Balls",
  "Fours",
  "Sixes",
  "Overs",
  "Maidens",
  "No Balls",
  "Wides",
  "Runs",
  "Wickets",
  "Count",
  "Inns",
  "C.Inns",
  "50 ups",
  "Chase",
  "Tp.Bt",
  "Match.Tp.Bt",
  "NoBalls",
  "Wides",
  "LegByes",
  "Byes",
  "Extras",
  "Overs",
  "PlayerID",
  "CompetitionID",
  "FormatID",
  "VenueID",
  "HostID",
  "TeamID",
  "TeamID",
  "Top Bowl",
  "Match Top Bowl",
  "Catches",
  "Year",
  "Time weighting",
  "W Runs",
  "W Com Inns",
  "W Balls Faced",
] as const;

export type ExportRow = (string | number | null)[];

export function emptyExportRow(): ExportRow {
  return EXPORT_CSV_HEADERS.map(() => null);
}

export function setCol(row: ExportRow, header: string, value: string | number | null): void {
  const indices: number[] = [];
  EXPORT_CSV_HEADERS.forEach((h, i) => {
    if (h === header) indices.push(i);
  });
  if (indices.length === 0) return;
  if (header === "Runs" && indices.length >= 2) {
    row[indices[0]!] = value;
    return;
  }
  if (header === "Wides" && indices.length >= 2) {
    row[indices[1]!] = value;
    return;
  }
  if (header === "Extras" && indices.length >= 2) {
    row[indices[0]!] = value;
    return;
  }
  if (header === "Overs" && indices.length >= 2) {
    row[indices[1]!] = value;
    return;
  }
  if (header === "Inns" && indices.length >= 2) {
    row[indices[0]!] = value;
    row[indices[1]!] = 1;
    return;
  }
  if (header === "TeamID" && indices.length >= 2) {
    row[indices[0]!] = value;
    row[indices[1]!] = value;
    return;
  }
  row[indices[0]!] = value;
}

/** Bowling runs column (second "Runs" header). */
export function setBowlingRuns(row: ExportRow, value: string | number | null): void {
  const idx = EXPORT_CSV_HEADERS.findIndex((h, i) => h === "Runs" && i > 20);
  if (idx >= 0) row[idx] = value;
}

/** Extras breakdown column (second "Extras" header). */
export function setExtrasBreakdown(row: ExportRow, value: string | number | null): void {
  const idx = EXPORT_CSV_HEADERS.findIndex((h, i) => h === "Extras" && i > 30);
  if (idx >= 0) row[idx] = value;
}

/** Bowling overs on player row (first "Overs" in bowling group). */
export function setBowlingOvers(row: ExportRow, value: string | number | null): void {
  const idx = EXPORT_CSV_HEADERS.indexOf("Overs");
  if (idx >= 0) row[idx] = value;
}

/** Team innings overs cap (last "Overs" column). */
export function setTeamOversCap(row: ExportRow, value: string | number | null): void {
  const idx = EXPORT_CSV_HEADERS.lastIndexOf("Overs");
  if (idx >= 0) row[idx] = value;
}

export function setBattingRuns(row: ExportRow, value: string | number | null): void {
  const idx = EXPORT_CSV_HEADERS.indexOf("Runs");
  if (idx >= 0) row[idx] = value;
}

export function setTeamExtras(row: ExportRow, value: string | number | null): void {
  const idx = EXPORT_CSV_HEADERS.indexOf("Extras");
  if (idx >= 0) row[idx] = value;
}

export function setBowlingWides(row: ExportRow, value: string | number | null): void {
  const idx = EXPORT_CSV_HEADERS.indexOf("Wides");
  if (idx >= 0) row[idx] = value;
}

export function setExtrasWides(row: ExportRow, value: string | number | null): void {
  const idx = EXPORT_CSV_HEADERS.findIndex((h, i) => h === "Wides" && i > 30);
  if (idx >= 0) row[idx] = value;
}
