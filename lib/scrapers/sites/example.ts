import { seededInt } from "@/lib/deterministic";
import type { ParsedScorecard, SiteAdapter, SiteMatchSummary } from "@/lib/scrapers/types";

function eachDay(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);
  while (cur <= last) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export const exampleSiteAdapter: SiteAdapter = {
  siteId: "example",
  label: "Example (deterministic mock)",

  discoverMatches(startIso: string, endIso: string): SiteMatchSummary[] {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const matches: SiteMatchSummary[] = [];
    for (const day of eachDay(start, end)) {
      const iso = day.toISOString().slice(0, 10);
      if (seededInt(`${iso}-has-match`, 0, 2) === 0) continue;
      const matchId = `demo-${iso}`;
      matches.push({
        matchId,
        title: `Demo ${iso}: Team ${String.fromCharCode(65 + seededInt(matchId, 0, 2))} v Team ${String.fromCharCode(67 + seededInt(matchId, 0, 2))}`,
        matchDate: iso,
        competition: "Demo Series",
        url: `https://example.com/cricket/${matchId}`,
      });
    }
    return matches;
  },

  fetchScorecard(matchId: string): ParsedScorecard {
    const runs = seededInt(`${matchId}-runs`, 120, 340);
    return {
      matchId,
      title: `Scorecard ${matchId}`,
      matchDate: matchId.replace("demo-", "").slice(0, 10) || null,
      inningsRaw: [
        {
          inningsNumber: 1,
          runs,
          wickets: seededInt(`${matchId}-wkts`, 3, 10),
          overs: "50.0",
        },
      ],
      notes: ["Mock adapter — swap for real HTML/API parser per site."],
    };
  },
};
