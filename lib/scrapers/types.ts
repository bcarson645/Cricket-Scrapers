export type SiteMatchSummary = {
  matchId: string;
  title: string;
  matchDate: string | null;
  competition: string | null;
  url: string | null;
};

export type ParsedScorecard = {
  matchId: string;
  title: string | null;
  matchDate: string | null;
  inningsRaw: Record<string, unknown>[];
  notes: string[];
};

/** Replace ScorecardDocument when the official export spec arrives. */
export type ScorecardDocument = {
  schemaVersion: string;
  sourceSite: string;
  sourceMatchId: string;
  matchTitle: string | null;
  matchDate: string | null;
  scrapedAt: string;
  innings: Record<string, unknown>[];
  extensions: Record<string, unknown>;
};

export interface SiteAdapter {
  siteId: string;
  label: string;
  discoverMatches(startIso: string, endIso: string): SiteMatchSummary[];
  fetchScorecard(matchId: string): ParsedScorecard;
}
