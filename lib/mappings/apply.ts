import { setCol, type ExportRow } from "@/lib/scorecards/export-columns";
import { cell } from "@/lib/scorecards/rowAccess";
import { teamsFromParsedInnings } from "@/lib/mappings/matchKey";
import {
  findMatchByCricbuzzId,
  findMatchByDateAndTeams,
  resolvePlayerMapping,
} from "@/lib/mappings/resolve";
import type { MappingApplyOptions, MappingRegistry } from "@/lib/mappings/types";
import type { CricbuzzParsedMatch } from "@/lib/scrapers/sites/cricbuzz/parseHtml";

function teamInternalId(registry: MappingRegistry, teamName: string): number | null {
  const entry = registry.teams?.find(
    (t) => t.name.toLowerCase() === teamName.replace(/\(c\)|\(wk\)/gi, "").trim().toLowerCase(),
  );
  return entry?.internalTeamId ?? null;
}

/** Apply internal IDs and export names when registry entries exist. Scorecard stats unchanged. */
export function applyMappingRegistry(
  rows: ExportRow[],
  parsed: CricbuzzParsedMatch,
  registry: MappingRegistry,
  options?: MappingApplyOptions,
): ExportRow[] {
  const pair = teamsFromParsedInnings(parsed.innings);
  const teamA = pair?.[0] ?? parsed.innings[0]?.teamName ?? "";
  const teamB = pair?.[1] ?? parsed.innings[1]?.teamName ?? "";

  const matchMeta =
    findMatchByCricbuzzId(registry, parsed.cricbuzzMatchId) ??
    findMatchByDateAndTeams(registry, parsed.dateDisplay, teamA, teamB);

  const internalMatchId =
    options?.matchIdOverride != null && options.matchIdOverride !== ""
      ? options.matchIdOverride
      : (matchMeta?.internalMatchId ?? null);

  for (const row of rows) {
    if (internalMatchId != null) setCol(row, "ID", internalMatchId);

    if (matchMeta) {
      if (matchMeta.competitionId != null) setCol(row, "CompetitionID", matchMeta.competitionId);
      if (matchMeta.formatId != null) setCol(row, "FormatID", matchMeta.formatId);
      if (matchMeta.venueId != null) setCol(row, "VenueID", matchMeta.venueId);
      if (matchMeta.hostId != null) setCol(row, "HostID", matchMeta.hostId);
    }

    const teamName = String(cell(row, "Team") ?? "");
    const teamId = teamInternalId(registry, teamName);
    if (teamId != null) setCol(row, "TeamID", teamId);

    const cricbuzzPid = cell(row, "PlayerID");
    const name = String(cell(row, "Name") ?? "");
    const player = resolvePlayerMapping(
      registry,
      cricbuzzPid != null ? String(cricbuzzPid) : null,
      name,
    );
    if (player) {
      setCol(row, "PlayerID", player.internalPlayerId);
      if (player.exportName) setCol(row, "Name", player.exportName);
    }
  }

  return rows;
}
