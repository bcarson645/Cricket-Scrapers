import { NextRequest, NextResponse } from "next/server";
import { discoverMatches } from "@/app/data/scrapeWorkbench";
import { insertScrapeRun, upsertScorecard } from "@/lib/scrapeDb";
import { getSiteAdapter } from "@/lib/scrapers/registry";
import { toScorecardDocument } from "@/lib/scrapers/normalize";

export const maxDuration = 60;

type Body = {
  siteId?: string;
  start?: string;
  end?: string;
  matchIds?: string[];
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { siteId, start, end, matchIds } = body;
  if (!siteId || !start || !end || !matchIds?.length) {
    return NextResponse.json(
      { error: "siteId, start, end, and matchIds are required" },
      { status: 400 },
    );
  }

  try {
    const discovered = discoverMatches(siteId, start, end);
    const byId = new Map(discovered.matches.map((m) => [m.matchId, m]));
    const adapter = getSiteAdapter(siteId);
    const runId = insertScrapeRun(siteId, start, end, matchIds.length);

    let saved = 0;
    for (const matchId of matchIds) {
      const summary = byId.get(matchId) ?? null;
      const parsed = adapter.fetchScorecard(matchId);
      const doc = toScorecardDocument(siteId, summary, parsed);
      upsertScorecard(runId, siteId, matchId, doc);
      saved += 1;
    }

    return NextResponse.json({ runId, saved });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Scrape failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
