import { normalizePersonName } from "@/lib/scrapers/sites/cricbuzz/dismissal";
import { matchRegistryKey } from "@/lib/mappings/matchKey";
import type { MappingRegistry, MatchRegistryEntry, PlayerRegistryEntry } from "@/lib/mappings/types";

export function findPlayerByCricbuzzId(
  registry: MappingRegistry,
  cricbuzzPlayerId: string | null,
): PlayerRegistryEntry | undefined {
  if (!cricbuzzPlayerId) return undefined;
  return registry.players.find((p) => p.cricbuzzPlayerId === cricbuzzPlayerId);
}

export function findPlayerByName(
  registry: MappingRegistry,
  cricbuzzName: string,
): PlayerRegistryEntry | undefined {
  const target = normalizePersonName(cricbuzzName);
  return registry.players.find((p) => {
    if (normalizePersonName(p.exportName ?? "") === target) return true;
    return p.aliases?.some((a) => normalizePersonName(a) === target);
  });
}

export function resolvePlayerMapping(
  registry: MappingRegistry,
  cricbuzzPlayerId: string | null,
  cricbuzzName: string,
): PlayerRegistryEntry | undefined {
  return (
    findPlayerByCricbuzzId(registry, cricbuzzPlayerId) ??
    findPlayerByName(registry, cricbuzzName)
  );
}

export function findMatchByCricbuzzId(
  registry: MappingRegistry,
  cricbuzzMatchId: string,
): MatchRegistryEntry | undefined {
  return registry.matches.find((m) => m.cricbuzzMatchId === cricbuzzMatchId);
}

export function findMatchByDateAndTeams(
  registry: MappingRegistry,
  date: string | null,
  teamA: string,
  teamB: string,
): MatchRegistryEntry | undefined {
  if (!date) return undefined;
  const key = matchRegistryKey(date, teamA, teamB);
  return registry.matches.find((m) => matchRegistryKey(m.date, m.teams[0], m.teams[1]) === key);
}

export function inferInternalMatchId(
  registry: MappingRegistry,
  params: {
    cricbuzzMatchId: string;
    date: string | null;
    teamA: string;
    teamB: string;
  },
): number | null {
  const byCb = findMatchByCricbuzzId(registry, params.cricbuzzMatchId);
  if (byCb) return byCb.internalMatchId;
  const byDate = findMatchByDateAndTeams(registry, params.date, params.teamA, params.teamB);
  return byDate?.internalMatchId ?? null;
}

export function listUnmappedPlayers(
  registry: MappingRegistry,
  rows: { cricbuzzPlayerId: string | null; name: string }[],
  cricbuzzMatchId: string,
): { cricbuzzPlayerId: string | null; cricbuzzName: string; seenInMatchId: string }[] {
  const out: { cricbuzzPlayerId: string | null; cricbuzzName: string; seenInMatchId: string }[] =
    [];
  const seen = new Set<string>();
  for (const row of rows) {
    const key = row.cricbuzzPlayerId ?? row.name;
    if (seen.has(key)) continue;
    seen.add(key);
    if (resolvePlayerMapping(registry, row.cricbuzzPlayerId, row.name)) continue;
    out.push({
      cricbuzzPlayerId: row.cricbuzzPlayerId,
      cricbuzzName: row.name,
      seenInMatchId: cricbuzzMatchId,
    });
  }
  return out;
}
