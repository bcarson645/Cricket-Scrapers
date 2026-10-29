/** Normalize team label for stable match keys (India, england, etc.). */
export function normalizeTeamKey(name: string): string {
  return name
    .replace(/\(c\)|\(wk\)|†/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Canonical key from date + two teams (sorted). */
export function matchRegistryKey(date: string, teamA: string, teamB: string): string {
  const d = date.trim();
  const teams = [normalizeTeamKey(teamA), normalizeTeamKey(teamB)].sort();
  return `${d}|${teams[0]}|${teams[1]}`;
}

export function teamsFromParsedInnings(
  innings: { teamName: string }[],
): [string, string] | null {
  if (innings.length < 2) return null;
  return [innings[0]!.teamName, innings[1]!.teamName];
}
