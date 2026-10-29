import type { SiteMatchSummary } from "@/lib/scrapers/types";
import {
  parseCricbuzzMatchLinksFromHtml,
  sortMatchesByDateDesc,
} from "@/lib/scrapers/sites/cricbuzz/discoverListings";
import { parseCricbuzzMatchId } from "@/lib/scrapers/sites/cricbuzz/matchId";

export { compareExportDates, exportDateToSortKey } from "@/lib/scrapers/sites/cricbuzz/discoverListings";

export function parseCricbuzzRecentMatchesHtml(html: string): SiteMatchSummary[] {
  return parseCricbuzzMatchLinksFromHtml(html);
}

export async function discoverCricbuzzRecentMatches(
  fetchHtml: (url: string) => Promise<string>,
): Promise<SiteMatchSummary[]> {
  const url = "https://www.cricbuzz.com/cricket-match/live-scores/recent-matches";
  const html = await fetchHtml(url);
  return sortMatchesByDateDesc(parseCricbuzzMatchLinksFromHtml(html));
}

export function assertCricbuzzMatchId(id: string): string {
  return parseCricbuzzMatchId(id);
}
