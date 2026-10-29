import type { ParsedScorecard, SiteAdapter } from "@/lib/scrapers/types";
import { parseCricbuzzMatchId } from "@/lib/scrapers/sites/cricbuzz/matchId";

/** Lightweight adapter for registry / workbench — does not import cheerio or scrape pipeline. */
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
  const { scrapeCricbuzzScorecard } = await import("@/lib/scrapers/sites/cricbuzz/scrape");
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
