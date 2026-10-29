import type { ParsedScorecard, SiteAdapter } from "@/lib/scrapers/types";
import { parseCricbuzzMatchId, scrapeCricbuzzScorecard } from "@/lib/scrapers/sites/cricbuzz/scrape";

export const cricbuzzSiteAdapter: SiteAdapter = {
  siteId: "cricbuzz",
  label: "Cricbuzz",

  discoverMatches() {
    return [];
  },

  fetchScorecard(matchId: string): ParsedScorecard {
    void matchId;
    throw new Error("Use /api/cricbuzz/scorecard?url=... or npm run scrape:cricbuzz for Cricbuzz.");
  },
};

export async function fetchCricbuzzParsed(matchIdOrUrl: string): Promise<ParsedScorecard> {
  const { match, rows, sourceUrl } = await scrapeCricbuzzScorecard(matchIdOrUrl);
  return {
    matchId: match.id,
    title: `${match.format ?? "Match"} ${match.id}`,
    matchDate: match.date,
    inningsRaw: rows as unknown as Record<string, unknown>[],
    notes: [`Cricbuzz ${sourceUrl}`, `${rows.length} export rows`],
  };
}
export function cricbuzzIdFromInput(input: string): string {
  return parseCricbuzzMatchId(input);
}
