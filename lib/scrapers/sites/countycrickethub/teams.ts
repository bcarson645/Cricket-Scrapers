const MENS_COUNTIES = [
  "",
  "Derbyshire",
  "Durham",
  "Essex",
  "Glamorgan",
  "Gloucestershire",
  "Hampshire",
  "Kent",
  "Lancashire",
  "Leicestershire",
  "Middlesex",
  "Northamptonshire",
  "Nottinghamshire",
  "Somerset",
  "Surrey",
  "Sussex",
  "Warwickshire",
  "Worcestershire",
  "Yorkshire",
] as const;

/** Mirrors County Cricket Hub `getTeamName` for men's counties (site M). */
/** All county squad labels for filters (18 teams per competition). */
export function countyNamesForSite(site: "M" | "F"): string[] {
  return Array.from({ length: 18 }, (_, i) => countyNameFromTeamId(i + 1, site));
}

export function countyNameFromTeamId(teamId: number, site: "M" | "F" = "M"): string {
  if (site === "F" && teamId > 200 && teamId < 219) {
    const idx = teamId - 200;
    return `${MENS_COUNTIES[idx] ?? "Unknown"} Women`;
  }
  if (teamId > 0 && teamId < MENS_COUNTIES.length) {
    return MENS_COUNTIES[teamId] ?? `Team ${teamId}`;
  }
  return `Team ${teamId}`;
}
