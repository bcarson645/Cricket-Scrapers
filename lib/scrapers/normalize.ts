import type { ParsedScorecard, ScorecardDocument, SiteMatchSummary } from "@/lib/scrapers/types";

export function toScorecardDocument(
  siteId: string,
  summary: SiteMatchSummary | null,
  parsed: ParsedScorecard,
): ScorecardDocument {
  return {
    schemaVersion: "0.1.0-placeholder",
    sourceSite: siteId,
    sourceMatchId: parsed.matchId,
    matchTitle: summary?.title ?? parsed.title,
    matchDate: summary?.matchDate ?? parsed.matchDate,
    scrapedAt: new Date().toISOString(),
    innings: parsed.inningsRaw,
    extensions: { notes: parsed.notes },
  };
}
