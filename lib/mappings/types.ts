/** Sportradar / internal registry loaded from fixtures or a future DB import. */
export type PlayerRegistryEntry = {
  internalPlayerId: number;
  cricbuzzPlayerId: string;
  /** Preferred export `Name` when mapped (e.g. SV Samson). */
  exportName?: string;
  /** Optional aliases for name-only fallback before Cricbuzz id is known. */
  aliases?: string[];
};

export type MatchRegistryEntry = {
  internalMatchId: number;
  cricbuzzMatchId?: string;
  /** M/D/YYYY, same shape as export `Date`. */
  date: string;
  /** Two team labels; order does not matter for lookup. */
  teams: [string, string];
  format?: string;
  venueId?: number;
  hostId?: number;
  competitionId?: number;
  formatId?: number;
};

export type TeamRegistryEntry = {
  name: string;
  internalTeamId: number;
};

export type MappingRegistry = {
  version: 1;
  players: PlayerRegistryEntry[];
  matches: MatchRegistryEntry[];
  teams?: TeamRegistryEntry[];
};

export type MappingApplyOptions = {
  /** UI / CLI override; wins over registry inference. */
  matchIdOverride?: string | number;
};

export type UnmappedPlayerHint = {
  cricbuzzPlayerId: string | null;
  cricbuzzName: string;
  seenInMatchId: string;
};
